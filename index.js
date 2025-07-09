const axios = require('axios');
const ExcelJS = require('exceljs');
const XLSX = require('xlsx');

const CONFIG = {
  MOYSKLAD: {
    TOKEN: '9a2a1ef6a8ff0196bae1e8eb8cdac6496b9f1fee',
    API_URL: 'https://api.moysklad.ru/api/remap/1.2'
  },
  APP: {
    PASSWORD: 'JGiVmvsZ'
  },
  STATUSES: {
    NEW: 'bdd69650-1133-11ee-0a80-026b000145f4',
    QUOTATION_IN_PROCESS: '3b5e76ca-9789-11ee-0a80-0e9e002be3e8',
    READY_TO_BE_UPLOADED: '44a23cdb-7a80-11ef-0a80-091a004741ae',
    NEED_TO_CHECK: '4d4dead2-571d-11f0-0a80-043800077533',
    CANT_BE_OFFERED: '71877cd1-9204-11ef-0a80-13200014596a'
  },
  ATTRIBUTES: {
    ORDER_BRAND: '82b29cd8-5ee1-11ef-0a80-116b000fe66a',
    PRODUCT_BRAND: '41171f66-d950-11ef-0a80-149f00021879',
    BUYER_REMARK: 'd548653d-ea02-11ef-0a80-13cf0035379b',
    ATTACHMENTS: 'e40b49c9-5265-11f0-0a80-01b7001c678d',
    CHINESE_DESCRIPTION: '2ca98799-6c48-11ef-0a80-071f0011d1cb',
    DELIVERY_TIME: '16244dcb-4a9f-11ee-0a80-07d500255239',
    PRICE_POLICY: '55ceea3f-6ee1-11ef-0a80-169e0001ab09',
    MERGED_SO: 'c85347a5-55fe-11f0-0a80-147800021ae0',
    REMARK_TO_OFFER: '03f2c655-5720-11f0-0a80-134300085bc2'
  },
  ENTITIES: {
    PRICE_POLICY_ITEM: '30bd2648-6ee1-11ef-0a80-111700017241'
  },
  PRICE_TYPES: {
    LXKS: '46719f1d-b63a-11ef-0a80-043e003ebf23',
    SALES: 'bd2595a3-1133-11ee-0a80-026b000145cd'
  },
  CURRENCY: 'bd254d95-1133-11ee-0a80-026b000145cc',
  CUSTOM_ENTITIES: {
    BRANDS: '6767af38-b6f0-11ef-0a80-0bfb000e123e'
  },
  ALLOWED_ORIGINS: [
    'https://geartechsol.com',
    'http://localhost:8080',
    'https://your-tilda-site.tilda.ws'
  ]
};

const getCorsHeaders = (origin) => {
  const allowedOrigin = CONFIG.ALLOWED_ORIGINS.includes(origin) ? origin : CONFIG.ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
};

const formatDate = (dateStr) => {
  const [datePart] = dateStr.split(' ');
  return datePart.split('-').reverse().join('.');
};

const convertXlsToXlsx = async (fileBuffer) => {
  try {
    const xlsWorkbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    const xlsSheet = xlsWorkbook.Sheets[xlsWorkbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(xlsSheet, { header: 1, defval: '' });

    jsonData.forEach((row, rowIndex) => {
      row.forEach((cellValue, colIndex) => {
        const cell = worksheet.getCell(rowIndex + 1, colIndex + 1);
        cell.value = cellValue;
      });
    });

    return workbook;
  } catch (error) {
    console.error('XLS conversion error:', error);
    throw new Error('Failed to convert XLS to XLSX');
  }
};

const moyskladRequest = async (method, url, data = null, params = {}) => {
  try {
    const fullUrl = `${CONFIG.MOYSKLAD.API_URL}${url}`;
    console.log(`[API Request] Making request to: ${method} ${fullUrl}`);
    
    const config = {
      method,
      url: fullUrl,
      headers: {
        'Authorization': `Bearer ${CONFIG.MOYSKLAD.TOKEN}`,
        'Accept': 'application/json;charset=utf-8',
        'Content-Type': 'application/json',
        'X-Lognex-Format-Precision': 'false'
      },
      params,
      timeout: 30000
    };

    if (data) {
      config.data = data;
      console.log('[API Request] Request data:', JSON.stringify(data, null, 2));
    }

    console.log('[API Request] Full config:', {
      ...config,
      headers: {
        ...config.headers,
        'Authorization': `Bearer ${CONFIG.MOYSKLAD.TOKEN.substring(0, 10)}...`
      }
    });

    const response = await axios(config);
    
    console.log(`[API Request] Response status: ${response.status}`);
    console.log('[API Request] Response headers:', response.headers);
    
    return response.data;
  } catch (error) {
    console.error('[API Request] Error details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      stack: error.stack
    });
    
    throw error;
  }
};

const updateRemarkToOffer = async (orderId, positionsData) => {
  try {
    console.log(`[RemarkToOffer] Updating for order ${orderId} with ${positionsData.length} positions`);
    
    const response = await moyskladRequest('PUT', `/entity/customerorder/${orderId}`, {
      attributes: [
        {
          meta: {
            type: 'attributemetadata',
            href: `${CONFIG.MOYSKLAD.API_URL}/entity/customerorder/metadata/attributes/${CONFIG.ATTRIBUTES.REMARK_TO_OFFER}`
          },
          value: JSON.stringify(positionsData.map(pos => ({
            positionId: pos.positionId,
            positionIndex: pos.positionIndex,
            initialPN: pos.initialPn,
            actualPN: pos.actualPn,
            status: pos.status
          })))
        }
      ]
    });
    
    console.log(`[RemarkToOffer] Successfully updated for order ${orderId}`);
    return response;
  } catch (error) {
    console.error(`[RemarkToOffer] Failed to update for order ${orderId}:`, error);
    throw new Error(`Failed to update REMARK_TO_OFFER: ${error.message}`);
  }
};

const updatePositionStatus = async (orderId, positionId, currentProductCode, status) => {
  try {
    console.log(`[Position Status] Updating status for position ${positionId} in order ${orderId} to ${status}`);
    
    const order = await moyskladRequest('GET', `/entity/customerorder/${orderId}`, null, {
      expand: 'positions,attributes'
    });
    
    let remarkData = [];
    const remarkAttribute = order.attributes.find(
      attr => attr.id === CONFIG.ATTRIBUTES.REMARK_TO_OFFER
    );
    
    if (remarkAttribute?.value) {
      try {
        remarkData = JSON.parse(remarkAttribute.value);
        console.log('[Position Status] Loaded existing REMARK_TO_OFFER data with', remarkData.length, 'items');
      } catch (e) {
        console.warn('[Position Status] Failed to parse existing REMARK_TO_OFFER data', e);
      }
    }
    
    const positionIndex = remarkData.findIndex(item => 
      item.positionId === positionId || 
      (item.initialPn === currentProductCode && item.actualPn === currentProductCode)
    );
    
    if (positionIndex >= 0) {
      remarkData[positionIndex].status = status;
      if (status === 'CANT_BE_OFFERED') {
        remarkData[positionIndex].actualPn = 'N/A';
      }
    } else {
      remarkData.push({
        positionId,
        initialPn: currentProductCode,
        actualPn: status === 'CANT_BE_OFFERED' ? 'N/A' : currentProductCode,
        status
      });
    }
    
    // Check if we need to update order status
    let orderStatus = null;
    const hasNeedCheckPositions = remarkData.some(item => item.status === 'NEED_TO_CHECK');
    const allPositionsCantBeOffered = remarkData.length > 0 && remarkData.every(item => item.status === 'CANT_BE_OFFERED');
    
    if (allPositionsCantBeOffered) {
      orderStatus = CONFIG.STATUSES.CANT_BE_OFFERED;
    } else if (!hasNeedCheckPositions) {
      orderStatus = CONFIG.STATUSES.READY_TO_BE_UPLOADED;
    } else {
      orderStatus = CONFIG.STATUSES.NEED_TO_CHECK;
    }
    
    const updatePayload = {
      attributes: [{
        meta: {
          type: 'attributemetadata',
          href: `${CONFIG.MOYSKLAD.API_URL}/entity/customerorder/metadata/attributes/${CONFIG.ATTRIBUTES.REMARK_TO_OFFER}`
        },
        value: JSON.stringify(remarkData)
      }]
    };
    
    if (orderStatus) {
      updatePayload.state = {
        meta: {
          href: `${CONFIG.MOYSKLAD.API_URL}/entity/customerorder/metadata/states/${orderStatus}`,
          type: 'state',
          mediaType: 'application/json'
        }
      };
    }
    
    const response = await moyskladRequest('PUT', `/entity/customerorder/${orderId}`, updatePayload);
    
    console.log(`[Position Status] Successfully updated status for position ${positionId}`);
    return response;
  } catch (error) {
    console.error(`[Position Status] Failed to update status for position ${positionId}:`, error);
    throw new Error(`Failed to update position status: ${error.message}`);
  }
};

const getNeedCheckPositions = async (orderId) => {
  try {
    console.log(`[Need Check Positions] Getting positions for order ${orderId}`);
    
    const order = await moyskladRequest('GET', `/entity/customerorder/${orderId}`, null, {
      expand: 'positions,positions.assortment,attributes'
    });
    
    let remarkData = [];
    const remarkAttribute = order.attributes.find(
      attr => attr.id === CONFIG.ATTRIBUTES.REMARK_TO_OFFER
    );
    
    if (remarkAttribute?.value) {
      try {
        remarkData = JSON.parse(remarkAttribute.value);
        console.log('[Need Check Positions] Loaded REMARK_TO_OFFER data with', remarkData.length, 'items');
      } catch (e) {
        console.warn('[Need Check Positions] Failed to parse REMARK_TO_FFOER data', e);
      }
    }
    
    const needCheckPositions = [];
    order.positions.rows.forEach((position, index) => {
      const remarkItem = remarkData.find(item => 
        item.positionId === position.id || 
        (item.initialPn === position.assortment?.code && item.actualPn === position.assortment?.code)
      );
      
      if (remarkItem && remarkItem.status === 'NEED_TO_CHECK') {
        needCheckPositions.push({
          id: position.id,
          index: index + 1,
          code: position.assortment?.code || 'N/A',
          quantity: position.quantity || 0
        });
      }
    });
    
    console.log(`[Need Check Positions] Found ${needCheckPositions.length} positions to check`);
    return {
      success: true,
      positions: needCheckPositions
    };
  } catch (error) {
    console.error('[Need Check Positions] Error:', error);
    throw new Error(`Failed to get need check positions: ${error.message}`);
  }
};

const createProduct = async (code, name) => {
  try {
    if (!code) throw new Error('Product code is required');

    const productData = {
      name: name || code,
      code,
      article: code
    };

    const response = await moyskladRequest('POST', '/entity/product', productData);
    return response;
  } catch (error) {
    console.error('Product creation error:', { code, name, error: error.response?.data || error.message });
    throw new Error(`Failed to create product: ${error.response?.data?.errors?.[0]?.error || error.message}`);
  }
};

const getCaterpillarBrandReference = async () => {
  try {
    const response = await moyskladRequest(
      'GET',
      `/entity/customentity/${CONFIG.CUSTOM_ENTITIES.BRANDS}`,
      null,
      { filter: 'name=CATERPILLAR' }
    );
    
    if (response.rows.length === 0) {
      throw new Error('Brand CATERPILLAR not found in custom dictionary');
    }
    
    return {
      meta: {
        href: response.rows[0].meta.href,
        type: 'customentity',
        mediaType: 'application/json'
      },
      name: 'CATERPILLAR'
    };
  } catch (error) {
    console.error('Failed to get CATERPILLAR brand reference:', error);
    throw new Error('Failed to get brand reference');
  }
};

const updateProduct = async (productId, updateData) => {
  try {
    if (!productId) throw new Error('Product ID is required');

    const existingProduct = await moyskladRequest('GET', `/entity/product/${productId}`);
    
    const payload = {
      ...existingProduct,
      weight: updateData.weight !== undefined ? updateData.weight : existingProduct.weight
    };

    const attributes = existingProduct.attributes || [];
    const brandRef = await getCaterpillarBrandReference();

    const brandAttrIndex = attributes.findIndex(attr => 
      attr.meta.href.includes(CONFIG.ATTRIBUTES.PRODUCT_BRAND)
    );
    
    const brandAttr = {
      meta: {
        href: `${CONFIG.MOYSKLAD.API_URL}/entity/product/metadata/attributes/${CONFIG.ATTRIBUTES.PRODUCT_BRAND}`,
        type: 'attributemetadata',
        mediaType: 'application/json'
      },
      value: brandRef
    };

    if (brandAttrIndex >= 0) {
      attributes[brandAttrIndex] = brandAttr;
    } else {
      attributes.push(brandAttr);
    }

    if (updateData.chineseDescription) {
      const chineseDescIndex = attributes.findIndex(attr => 
        attr.meta && attr.meta.href.includes(CONFIG.ATTRIBUTES.CHINESE_DESCRIPTION)
      );
      
      const chineseDescAttr = {
        meta: {
          href: `${CONFIG.MOYSKLAD.API_URL}/entity/product/metadata/attributes/${CONFIG.ATTRIBUTES.CHINESE_DESCRIPTION}`,
          type: 'attributemetadata',
          mediaType: 'application/json'
        },
        value: updateData.chineseDescription
      };

      if (chineseDescIndex >= 0) {
        attributes[chineseDescIndex] = chineseDescAttr;
      } else {
        attributes.push(chineseDescAttr);
      }
    }

    if (updateData.deliveryTime) {
      const deliveryTimeIndex = attributes.findIndex(attr => 
        attr.meta && attr.meta.href.includes(CONFIG.ATTRIBUTES.DELIVERY_TIME)
      );
      
      const deliveryTimeAttr = {
        meta: {
          href: `${CONFIG.MOYSKLAD.API_URL}/entity/product/metadata/attributes/${CONFIG.ATTRIBUTES.DELIVERY_TIME}`,
          type: 'attributemetadata',
          mediaType: 'application/json'
        },
        value: updateData.deliveryTime.toString()
      };

      if (deliveryTimeIndex >= 0) {
        attributes[deliveryTimeIndex] = deliveryTimeAttr;
      } else {
        attributes.push(deliveryTimeAttr);
      }
    }

    payload.attributes = attributes;
    const response = await moyskladRequest('PUT', `/entity/product/${productId}`, payload);
    return response;
  } catch (error) {
    console.error('Product update error:', {
      productId,
      updateData,
      error: error.response?.data || error.message
    });
    throw new Error(`Failed to update product ${productId}: ${error.response?.data?.errors?.[0]?.error || error.message}`);
  }
};

const updateProductPrice = async (productId, price) => {
  try {
    if (!productId) throw new Error('Product ID is required');
    if (typeof price !== 'number' || isNaN(price)) {
      throw new Error(`Invalid price value: ${price}`);
    }

    const product = await moyskladRequest('GET', `/entity/product/${productId}`);
    const updatedPrices = product.salePrices ? [...product.salePrices] : [];
    
    const existingPriceIndex = updatedPrices.findIndex(p => 
      p.priceType && p.priceType.id === CONFIG.PRICE_TYPES.LXKS
    );

    const newPrice = {
      value: Math.round(price * 100),
      currency: {
        meta: {
          href: `${CONFIG.MOYSKLAD.API_URL}/entity/currency/${CONFIG.CURRENCY}`,
          type: 'currency',
          mediaType: 'application/json'
        }
      },
      priceType: {
        meta: {
          href: `${CONFIG.MOYSKLAD.API_URL}/context/companysettings/pricetype/${CONFIG.PRICE_TYPES.LXKS}`,
          type: 'pricetype',
          mediaType: 'application/json'
        }
      }
    };

    if (existingPriceIndex >= 0) {
      updatedPrices[existingPriceIndex] = newPrice;
    } else {
      updatedPrices.push(newPrice);
    }

    const response = await moyskladRequest('PUT', `/entity/product/${productId}`, {
      salePrices: updatedPrices
    });

    return response;
  } catch (error) {
    console.error('Price update error:', {
      productId,
      price,
      error: error.response?.data || error.message
    });
    throw new Error(`Failed to update price for product ${productId}: ${error.response?.data?.errors?.[0]?.error || error.message}`);
  }
};

const getPricePolicy = async () => {
  try {
    console.log('[Price Policy] Loading price policy...');
    const response = await moyskladRequest(
      'GET',
      `/entity/product/${CONFIG.ENTITIES.PRICE_POLICY_ITEM}`,
      null,
      { fields: CONFIG.ATTRIBUTES.PRICE_POLICY }
    );
    
    const pricePolicyAttr = response.attributes.find(
      attr => attr.id === CONFIG.ATTRIBUTES.PRICE_POLICY
    );
    
    if (!pricePolicyAttr || !pricePolicyAttr.value) {
      throw new Error('Price policy attribute not found or empty');
    }
    
    const policy = JSON.parse(pricePolicyAttr.value);
    console.log('[Price Policy] Loaded successfully:', JSON.stringify(policy, null, 2));
    return policy;
  } catch (error) {
    console.error('[Price Policy] Failed to get price policy:', error);
    throw new Error('Failed to load price policy');
  }
};

const calculateSalesPrice = (basisPrice, markup) => {
  const markupPercent = parseFloat(markup) / 100;
  const calculated = basisPrice * (1 + markupPercent);
  const rounded = Math.ceil(calculated);
  console.log(`[Price Calc] Basis: ${basisPrice}, Markup: ${markup}%, Calculated: ${calculated}, Rounded: ${rounded}`);
  return rounded;
};

const updateOrderPrices = async (orderId) => {
  try {
    console.log('[Order Prices] Starting price update for order:', orderId);
    
    const pricePolicy = await getPricePolicy();
    const order = await moyskladRequest(
      'GET',
      `/entity/customerorder/${orderId}`,
      null,
      { 
        expand: 'positions,agent,positions.assortment,positions.assortment.attributes,positions.assortment.salePrices' 
      }
    );
    
    console.log(`[Order Prices] Order loaded. Customer: ${order.agent.name} (${order.agent.id})`);
    console.log(`[Order Prices] Positions count: ${order.positions.rows.length}`);

    const positionUpdates = [];
    let processedCount = 0;
    let skippedCount = 0;

    for (const position of order.positions.rows) {
      try {
        processedCount++;
        console.log(`\n[Order Prices] Processing position ${processedCount}: ${position.assortment.name} (${position.assortment.code})`);

        const brandAttr = position.assortment.attributes?.find(
          attr => attr.id === CONFIG.ATTRIBUTES.PRODUCT_BRAND
        );
        const brandId = brandAttr?.value?.meta?.href.split('/').pop();
        console.log('[Order Prices] Brand ID:', brandId || 'Not found');
        if (!brandId) {
          skippedCount++;
          continue;
        }

        const customerId = order.agent.meta.href.split('/').pop();
        console.log('[Order Prices] Customer ID:', customerId);

        const policyRule = pricePolicy.find(
          rule => rule.brand === brandId && rule.customer === customerId
        );
        console.log('[Order Prices] Policy rule:', policyRule || 'Not found');
        if (!policyRule) {
          skippedCount++;
          continue;
        }

        const basisPriceObj = position.assortment.salePrices?.find(
          price => price.priceType.id === policyRule.basis
        );
        console.log('[Order Prices] Basis price object:', basisPriceObj || 'Not found');
        if (!basisPriceObj) {
          skippedCount++;
          continue;
        }

        const basisPrice = basisPriceObj.value / 100;
        const markup = policyRule.markup;
        console.log('[Order Prices] Basis price:', basisPrice, 'Markup:', markup);

        const salesPrice = calculateSalesPrice(basisPrice, markup);
        console.log('[Order Prices] Calculated sales price:', salesPrice);

        positionUpdates.push({
          id: position.id,
          price: salesPrice * 100,
          salePrice: {
            value: salesPrice * 100,
            currency: {
              meta: {
                href: `${CONFIG.MOYSKLAD.API_URL}/entity/currency/${CONFIG.CURRENCY}`,
                type: 'currency',
                mediaType: 'application/json'
              }
            },
            priceType: {
              meta: {
                href: `${CONFIG.MOYSKLAD.API_URL}/context/companysettings/pricetype/${CONFIG.PRICE_TYPES.SALES}`,
                type: 'pricetype',
                mediaType: 'application/json'
              }
            }
          }
        });

      } catch (error) {
        console.error(`[Order Prices] Error processing position ${processedCount}:`, error);
        skippedCount++;
      }
    }

    console.log(`\n[Order Prices] Summary: Processed ${processedCount} positions, ${positionUpdates.length} to update, ${skippedCount} skipped`);

    if (positionUpdates.length > 0) {
      console.log('[Order Prices] Sending updates to Moysklad...');
      const updateResponse = await moyskladRequest(
        'PUT',
        `/entity/customerorder/${orderId}`,
        { positions: positionUpdates }
      );
      console.log('[Order Prices] Update successful:', updateResponse);
    } else {
      console.log('[Order Prices] No positions to update');
    }

    return {
      success: true,
      updatedPositions: positionUpdates.length,
      skippedPositions: skippedCount
    };

  } catch (error) {
    console.error('[Order Prices] Failed to update order prices:', error);
    throw new Error(`Failed to update order prices: ${error.message}`);
  }
};

const buildExcelMappings = (worksheet) => {
  const simpleMappings = {};
  const consecutiveGroups = {};
  const allExcelCodes = new Set();
  let currentGroup = null;

  for (let i = 1; i <= worksheet.rowCount; i++) {
    const cellC = worksheet.getCell(`C${i}`);
    const cellA = worksheet.getCell(`A${i}`);
    const cellH = worksheet.getCell(`H${i}`);
    
    if (cellC.value) {
      const codeC = cellC.value.toString().trim();
      allExcelCodes.add(codeC);
    }
    
    if (cellA.value) {
      const codeA = cellA.value.toString().trim();
      allExcelCodes.add(codeA);
    }

    if (cellC.value && cellA.value) {
      const codeC = cellC.value.toString().trim();
      const codeA = cellA.value.toString().trim();
      const quantity = parseFloat(cellH.value) || 1;

      if (!currentGroup || currentGroup.codeC !== codeC) {
        currentGroup = { codeC, items: [] };
      }
      
      currentGroup.items.push({
        codeA,
        quantity
      });

      const nextCellC = worksheet.getCell(`C${i+1}`);
      if (!nextCellC.value || nextCellC.value.toString().trim() !== codeC) {
        if (currentGroup.items.length > 1) {
          consecutiveGroups[codeC] = currentGroup.items;
        }
        currentGroup = null;
      }

      if (!simpleMappings[codeC]) {
        simpleMappings[codeC] = codeA;
      }
    }
  }

  return { 
    simpleMappings, 
    consecutiveGroups,
    allExcelCodes: Array.from(allExcelCodes)
  };
};

const findProduct = async (code) => {
  const response = await moyskladRequest('GET', '/entity/product', null, {
    filter: `code=${code}`
  }).catch(() => ({ rows: [] }));
  return response.rows[0];
};

const getOrCreateProduct = async (code, newProductsArray = []) => {
  let product = await findProduct(code);
  if (!product) {
    console.log(`Creating new product: ${code}`);
    product = await createProduct(code);
    newProductsArray.push(product);
  }
  return product;
};

const updateProductsFromExcel = async (worksheet, productsToUpdate = [], newProducts = []) => {
  console.log('[Excel Parser] Updating product data from Excel...');
  
  for (let i = 2; i <= worksheet.rowCount; i++) {
    const cellA = worksheet.getCell(`A${i}`);
    const code = cellA.value?.toString().trim();
    if (!code) continue;

    const cellB = worksheet.getCell(`B${i}`);
    const chineseDesc = cellB.value?.toString().trim();
    
    const cellG = worksheet.getCell(`G${i}`);
    const weight = parseFloat(cellG.value) || undefined;
    
    const cellI = worksheet.getCell(`I${i}`);
    let deliveryDays = 0;
    const deliveryMatch = cellI.value?.toString().trim().match(/(\d+)/);
    if (deliveryMatch) deliveryDays = parseInt(deliveryMatch[1]) + 3;

    const cellM = worksheet.getCell(`M${i}`);
    const cellO = worksheet.getCell(`O${i}`);
    const price = (parseFloat(cellM.value) || 0) + (parseFloat(cellO.value) || 0);

    let product = await findProduct(code);
    if (!product) {
      product = await createProduct(code);
      newProducts.push(product);
    }

    await updateProduct(product.id, {
      weight,
      chineseDescription: chineseDesc,
      deliveryTime: deliveryDays
    });

    if (price > 0) {
      await updateProductPrice(product.id, price);
    }

    productsToUpdate.push(product.id);
  }
};

const parseExcelFileForOrder = async (workbook, orderId) => {
  try {
    console.log(`[Excel Parser] Starting parsing for order: ${orderId}`);
    const worksheet = workbook.worksheets[0];

    console.log('[Order Data] Loading order data...');
    const order = await moyskladRequest('GET', `/entity/customerorder/${orderId}`, null, {
      expand: 'positions,positions.assortment,attributes'
    });
    
    const existingIdsMap = new Set(order.positions.rows.map(p => p.id));

    let existingRemarkData = [];
    const remarkAttribute = order.attributes.find(
      attr => attr.id === CONFIG.ATTRIBUTES.REMARK_TO_OFFER
    );
    
    if (remarkAttribute?.value) {
      try {
        existingRemarkData = JSON.parse(remarkAttribute.value);
        console.log('[Remark Data] Loaded existing data with', existingRemarkData.length, 'items');
      } catch (e) {
        console.warn('[Remark Data] Failed to parse existing data', e);
      }
    }

    console.log('[Excel Mappings] Building mappings...');
    const { simpleMappings, consecutiveGroups, allExcelCodes } = buildExcelMappings(worksheet);
    console.log('[Excel Mappings] Results:', {
      simple: Object.keys(simpleMappings).length,
      groups: Object.keys(consecutiveGroups).length,
      codes: allExcelCodes.length
    });

    const allPositions = [];
    const positionsToRemove = new Set();
    let currentIndex = 1;
    const newRemarkData = [];
    let hasMissingProducts = false;

    console.log('[Position Processing] Starting processing...');
    for (const originalPos of order.positions.rows) {
      const originalCode = originalPos.assortment?.code;
      if (!originalCode) continue;

      console.log(`[Position] Processing original: ${originalCode} (${originalPos.id})`);

      if (!allExcelCodes.includes(originalCode)) {
        hasMissingProducts = true;
        allPositions.push({
          id: originalPos.id,
          index: currentIndex++,
          code: originalCode,
          type: 'NEED_TO_CHECK',
          quantity: originalPos.quantity,
          originalCode,
          isExisting: true
        });
        
        newRemarkData.push({
          positionId: originalPos.id,
          positionIndex: currentIndex - 1,
          initialPn: originalCode,
          actualPn: originalCode,
          status: 'NEED_TO_CHECK'
        });
        continue;
      }

      if (consecutiveGroups[originalCode]) {
        positionsToRemove.add(originalPos.id);
        
        // Process each replacement item with its own quantity
        for (const replacementItem of consecutiveGroups[originalCode]) {
          const tempId = `new_${currentIndex}`;
          allPositions.push({
            id: tempId,
            index: currentIndex++,
            code: replacementItem.codeA,
            type: '1TOMANY',
            quantity: replacementItem.quantity, // Use individual quantity from column H
            originalCode,
            isExisting: false
          });
          
          newRemarkData.push({
            positionId: tempId,
            positionIndex: currentIndex - 1,
            initialPn: originalCode,
            actualPn: replacementItem.codeA,
            status: '1TOMANY'
          });
        }
      } 
      else if (simpleMappings[originalCode]) {
        allPositions.push({
          id: originalPos.id,
          index: currentIndex++,
          code: simpleMappings[originalCode],
          type: '1TO1',
          quantity: originalPos.quantity,
          originalCode,
          isExisting: true
        });
        
        newRemarkData.push({
          positionId: originalPos.id,
          positionIndex: currentIndex - 1,
          initialPn: originalCode,
          actualPn: simpleMappings[originalCode],
          status: '1TO1'
        });
      }
      else {
        allPositions.push({
          id: originalPos.id,
          index: currentIndex++,
          code: originalCode,
          type: 'OK',
          quantity: originalPos.quantity,
          originalCode,
          isExisting: true
        });
        
        newRemarkData.push({
          positionId: originalPos.id,
          positionIndex: currentIndex - 1,
          initialPn: originalCode,
          actualPn: originalCode,
          status: 'OK'
        });
      }
    }

    console.log(`[Position Deletion] Deleting ${positionsToRemove.size} positions...`);
    for (const positionId of positionsToRemove) {
      try {
        await moyskladRequest('DELETE', `/entity/customerorder/${orderId}/positions/${positionId}`);
        existingIdsMap.delete(positionId);
      } catch (error) {
        console.error(`[Position] Failed to delete ${positionId}:`, error);
      }
    }

    console.log('[Product Update] Updating products...');
    const newProducts = [];
    const productsToUpdate = [];
    
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const cellA = worksheet.getCell(`A${i}`);
      const code = cellA.value?.toString().trim();
      if (!code) continue;

      const cellB = worksheet.getCell(`B${i}`);
      const chineseDesc = cellB.value?.toString().trim();
      
      const cellG = worksheet.getCell(`G${i}`);
      const weight = parseFloat(cellG.value) || undefined;
      
      const cellI = worksheet.getCell(`I${i}`);
      let deliveryDays = 0;
      const deliveryMatch = cellI.value?.toString().trim().match(/(\d+)/);
      if (deliveryMatch) deliveryDays = parseInt(deliveryMatch[1]) + 3;

      // New price calculation: M + (O / H)
      const cellM = worksheet.getCell(`M${i}`);
      const cellO = worksheet.getCell(`O${i}`);
      const cellH = worksheet.getCell(`H${i}`);
      
      const basePrice = parseFloat(cellM.value) || 0;
      const additionalCost = parseFloat(cellO.value) || 0;
      const quantity = parseFloat(cellH.value) || 1;
      
      const price = basePrice + (additionalCost / quantity);
      const roundedPrice = Math.round(price * 100) / 100; // Round to 2 decimal places
      
      console.log(`[Price Calc] For ${code}: M=${basePrice}, O=${additionalCost}, H=${quantity} => Price=${roundedPrice}`);

      let product = await findProduct(code);
      if (!product) {
        product = await createProduct(code);
        newProducts.push(product);
      }

      await updateProduct(product.id, {
        weight,
        chineseDescription: chineseDesc,
        deliveryTime: deliveryDays
      });

      if (roundedPrice > 0) {
        await updateProductPrice(product.id, roundedPrice);
      }

      productsToUpdate.push(product.id);
    }

    const newPositionIds = {};
    console.log('[Position Creation] Starting creation/update...');

    const getNewPositionId = async (orderId, product, quantity) => {
      const currentPositions = await moyskladRequest('GET', 
        `/entity/customerorder/${orderId}/positions`,
        null,
        { expand: 'assortment' }
      );

      const marker = `GEN_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const createResponse = await moyskladRequest('POST', 
        `/entity/customerorder/${orderId}/positions`, 
        {
          assortment: { 
            meta: {
              href: `${CONFIG.MOYSKLAD.API_URL}/entity/product/${product.id}`,
              type: 'product',
              mediaType: 'application/json'
            }
          },
          quantity: quantity,
          description: marker
        }
      );

      let newId = createResponse.id || createResponse.meta?.href?.split('/').pop();
      if (newId) return newId;

      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedPositions = await moyskladRequest('GET', 
        `/entity/customerorder/${orderId}/positions`,
        null,
        { expand: 'assortment' }
      );

      const newPositions = updatedPositions.rows.filter(p => 
        !existingIdsMap.has(p.id) && 
        p.assortment.id === product.id &&
        Math.abs(p.quantity - quantity) < 0.01
      );

      if (newPositions.length > 0) {
        newPositions.sort((a, b) => new Date(b.created) - new Date(a.created));
        return newPositions[0].id;
      }

      throw new Error('Failed to identify new position ID');
    };

    for (const pos of allPositions) {
      try {
        const product = await getOrCreateProduct(pos.code, newProducts);
        
        if (pos.isExisting && !positionsToRemove.has(pos.id)) {
          await moyskladRequest('PUT', `/entity/customerorder/${orderId}/positions/${pos.id}`, {
            assortment: { 
              meta: {
                href: `${CONFIG.MOYSKLAD.API_URL}/entity/product/${product.id}`,
                type: 'product',
                mediaType: 'application/json'
              }
            },
            quantity: pos.quantity
          });
        } else if (!pos.isExisting) {
          const newId = await getNewPositionId(orderId, product, pos.quantity);
          newPositionIds[pos.id] = newId;
          existingIdsMap.add(newId);
          console.log(`[Position] Mapped temp ID ${pos.id} to real ID ${newId}`);
        }
      } catch (error) {
        console.error(`[Position] Failed to process ${pos.code}:`, error);
        throw error;
      }
    }

    console.log('[Remark Data] Finalizing data...');
    const finalRemarkData = newRemarkData.map(item => ({
      ...item,
      positionId: item.positionId.startsWith('new_') 
        ? newPositionIds[item.positionId] || item.positionId
        : item.positionId
    }));

    // Update order status if there are missing products
    let orderStatusUpdate = null;
    if (hasMissingProducts) {
      orderStatusUpdate = {
        state: {
          meta: {
            href: `${CONFIG.MOYSKLAD.API_URL}/entity/customerorder/metadata/states/${CONFIG.STATUSES.NEED_TO_CHECK}`,
            type: 'state',
            mediaType: 'application/json'
          }
        }
      };
    }

    const updatePayload = {
      attributes: [{
        meta: {
          type: 'attributemetadata',
          href: `${CONFIG.MOYSKLAD.API_URL}/entity/customerorder/metadata/attributes/${CONFIG.ATTRIBUTES.REMARK_TO_OFFER}`
        },
        value: JSON.stringify(finalRemarkData)
      }]
    };

    if (orderStatusUpdate) {
      updatePayload.state = orderStatusUpdate.state;
    }

    await moyskladRequest('PUT', `/entity/customerorder/${orderId}`, updatePayload);

    console.log('[Price Update] Starting...');
    await updateOrderPrices(orderId);

    return {
      success: true,
      positions: allPositions.map(p => ({
        index: p.index,
        code: p.code,
        quantity: p.quantity,
        type: p.type
      })),
      needCheckPositions: allPositions
        .filter(p => p.type === 'NEED_TO_CHECK')
        .map(p => p.code),
      remarkData: finalRemarkData
    };

  } catch (error) {
    console.error('[Excel Parser] Failed:', error);
    throw error;
  }
};

const processOrderAfterUpload = async (orderId, fileName, fileContent) => {
  try {
    console.log(`[Order Processing] Updating order ${orderId} after upload`);
    
    const updatePayload = {
      attributes: [
        {
          meta: {
            type: 'attributemetadata',
            href: `${CONFIG.MOYSKLAD.API_URL}/entity/customerorder/metadata/attributes/${CONFIG.ATTRIBUTES.ATTACHMENTS}`
          },
          file: {
            filename: fileName,
            content: fileContent
          }
        },
        {
          meta: {
            type: 'attributemetadata',
            href: `${CONFIG.MOYSKLAD.API_URL}/entity/customerorder/metadata/attributes/${CONFIG.ATTRIBUTES.BUYER_REMARK}`
          },
          value: 'handled by LXKS'
        }
      ]
    };

    const response = await moyskladRequest('PUT', `/entity/customerorder/${orderId}`, updatePayload);

    console.log(`[Order Processing] Successfully updated order ${orderId}`);
    return response;
  } catch (error) {
    console.error(`[Order Processing] Failed to update order ${orderId}:`, error);
    throw new Error(`Failed to update order ${orderId}: ${error.message}`);
  }
};

const uploadFileToOrders = async (orderIds, fileName, fileContent) => {
  try {
    console.log('[File Upload] Starting upload for orders:', orderIds);
    
    let finalFileName = fileName;
    let finalContent = fileContent;
    
    if (fileName.toLowerCase().endsWith('.xls')) {
      console.log('[File Upload] Converting XLS to XLSX...');
      const fileBuffer = Buffer.from(fileContent, 'base64');
      const workbook = await convertXlsToXlsx(fileBuffer);
      const buffer = await workbook.xlsx.writeBuffer();
      finalFileName = fileName.replace(/\.xls$/i, '.xlsx');
      finalContent = Buffer.from(buffer).toString('base64');
    }

    const buffer = Buffer.from(finalContent, 'base64');
    let workbook;
    if (buffer instanceof Buffer) {
      workbook = await convertXlsToXlsx(buffer);
    } else {
      workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
    }

    const results = [];
    
    for (const orderId of orderIds) {
      try {
        console.log(`[File Upload] Processing order ${orderId}`);
        
        const parseResult = await parseExcelFileForOrder(workbook, orderId);
        
        const orderUpdate = await processOrderAfterUpload(orderId, finalFileName, finalContent);
        
        results.push({
          orderId,
          parseResult,
          orderUpdate
        });
      } catch (error) {
        console.error(`[File Upload] Error processing order ${orderId}:`, error);
        results.push({
          orderId,
          error: error.message
        });
      }
    }

    console.log('[File Upload] Completed processing all orders');
    return {
      success: true,
      results
    };
  } catch (error) {
    console.error('[File Upload] Error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

const mergeOrders = async (orderIds) => {
  try {
    if (!orderIds || orderIds.length < 2) {
      throw new Error('At least 2 order IDs are required');
    }

    console.log(`[Merge Orders] Starting merge for orders: ${orderIds.join(', ')}`);
    
    const allPositions = [];
    for (const orderId of orderIds) {
      const positions = await moyskladRequest('GET', `/entity/customerorder/${orderId}/positions`, null, {
        expand: 'assortment'
      });
      allPositions.push(...positions.rows.map(pos => ({
        ...pos,
        orderId: orderId // Сохраняем ID заказа для каждой позиции
      })));
    }

    console.log(`[Merge Orders] Total positions found: ${allPositions.length}`);

    const mergedPositions = allPositions.map((pos, index) => ({
      index: index + 1,
      code: pos.assortment?.code || 'N/A',
      quantity: pos.quantity,
      name: pos.assortment?.name || 'Unknown',
      orderId: pos.orderId // Добавляем ID заказа к каждой позиции
    }));

    console.log(`[Merge Orders] Merged positions count: ${mergedPositions.length}`);

    const firstOrder = await moyskladRequest('GET', `/entity/customerorder/${orderIds[0]}`);
    const lastOrder = await moyskladRequest('GET', `/entity/customerorder/${orderIds[orderIds.length - 1]}`);
    
    const firstSuffix = firstOrder.name.slice(-3);
    const lastSuffix = lastOrder.name.slice(-3);
    const mergedName = `${firstSuffix}_${lastSuffix}`;

    console.log(`[Merge Orders] Merged name: ${mergedName}`);

    return {
      success: true,
      mergedName,
      mergedPositions
    };
  } catch (error) {
    console.error('[Merge Orders] Error:', error);
    throw new Error(`Failed to merge orders: ${error.message}`);
  }
};

const updateMergedOrdersStatus = async (orderIds, mergedName) => {
  try {
    console.log(`[Update Merged Orders] Updating status for ${orderIds.length} orders`);
    
    for (const orderId of orderIds) {
      try {
        console.log(`[Update Merged Orders] Updating order ${orderId}`);
        await moyskladRequest('PUT', `/entity/customerorder/${orderId}`, {
          attributes: [
            {
              meta: {
                type: 'attributemetadata',
                href: `${CONFIG.MOYSKLAD.API_URL}/entity/customerorder/metadata/attributes/${CONFIG.ATTRIBUTES.BUYER_REMARK}`
              },
              value: 'handled by LXKS'
            },
            {
              meta: {
                type: 'attributemetadata',
                href: `${CONFIG.MOYSKLAD.API_URL}/entity/customerorder/metadata/attributes/${CONFIG.ATTRIBUTES.MERGED_SO}`
              },
              value: mergedName
            }
          ],
          state: {
            meta: {
              href: `${CONFIG.MOYSKLAD.API_URL}/entity/customerorder/metadata/states/${CONFIG.STATUSES.QUOTATION_IN_PROCESS}`,
              type: 'state',
              mediaType: 'application/json'
            }
          }
        });
        console.log(`[Update Merged Orders] Successfully updated order ${orderId}`);
      } catch (error) {
        console.error(`[Update Merged Orders] Failed to update order ${orderId}:`, error);
        throw error;
      }
    }
    
    return {
      success: true,
      updatedOrders: orderIds.length
    };
  } catch (error) {
    console.error('[Update Merged Orders] Error:', error);
    throw new Error(`Failed to update merged orders status: ${error.message}`);
  }
};

const replaceProductInOrder = async (orderId, positionId, currentProductCode, newProductCode) => {
  try {
    console.log(`[Replace Product] Starting replacement in order ${orderId}, position ${positionId}`);
    console.log(`[Replace Product] Replacing ${currentProductCode} with ${newProductCode}`);

    const position = await moyskladRequest('GET', `/entity/customerorder/${orderId}/positions/${positionId}`, null, {
      expand: 'assortment'
    });

    let newProduct;
    const productResponse = await moyskladRequest('GET', '/entity/product', null, {
      filter: `code=${newProductCode}`
    }).catch(() => ({ rows: [] }));

    if (productResponse.rows.length === 0) {
      console.log(`[Replace Product] Creating new product: ${newProductCode}`);
      newProduct = await createProduct(newProductCode);
    } else {
      newProduct = productResponse.rows[0];
    }

    const updateResponse = await moyskladRequest('PUT', `/entity/customerorder/${orderId}/positions/${positionId}`, {
      assortment: {
        meta: {
          href: newProduct.meta.href,
          type: newProduct.meta.type,
          mediaType: 'application/json'
        }
      },
      quantity: position.quantity
    });

    await updateOrderPrices(orderId);

    console.log(`[Replace Product] Successfully replaced product in order ${orderId}`);
    return {
      success: true,
      position: updateResponse,
      newProduct
    };
  } catch (error) {
    console.error(`[Replace Product] Failed to replace product in order ${orderId}:`, error);
    throw new Error(`Failed to replace product: ${error.message}`);
  }
};

const replaceProductInGroup = async (orderIds, positionId, currentProductCode, newProductCode) => {
  try {
    console.log(`[Replace Product] Starting replacement in group orders: ${orderIds.join(', ')}`);
    console.log(`[Replace Product] Replacing ${currentProductCode} with ${newProductCode}`);

    let newProduct;
    const productResponse = await moyskladRequest('GET', '/entity/product', null, {
      filter: `code=${newProductCode}`
    }).catch(() => ({ rows: [] }));

    if (productResponse.rows.length === 0) {
      console.log(`[Replace Product] Creating new product: ${newProductCode}`);
      newProduct = await createProduct(newProductCode);
    } else {
      newProduct = productResponse.rows[0];
    }

    const results = [];
    for (const orderId of orderIds) {
      try {
        const positions = await moyskladRequest('GET', `/entity/customerorder/${orderId}/positions`, null, {
          expand: 'assortment'
        });

        const positionsToUpdate = positions.rows.filter(pos => 
          pos.assortment?.code === currentProductCode
        );

        for (const position of positionsToUpdate) {
          const updateResponse = await moyskladRequest('PUT', `/entity/customerorder/${orderId}/positions/${position.id}`, {
            assortment: {
              meta: {
                href: newProduct.meta.href,
                type: newProduct.meta.type,
                mediaType: 'application/json'
              }
            },
            quantity: position.quantity
          });
          results.push({
            orderId,
            positionId: position.id,
            success: true,
            response: updateResponse
          });
        }

        await updateOrderPrices(orderId);
      } catch (error) {
        console.error(`[Replace Product] Error processing order ${orderId}:`, error);
        results.push({
          orderId,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`[Replace Product] Completed replacement in group orders`);
    return {
      success: true,
      results,
      newProduct
    };
  } catch (error) {
    console.error('[Replace Product] Failed to replace product in group:', error);
    throw new Error(`Failed to replace product in group: ${error.message}`);
  }
};

const getOrdersByStatus = async (statusId, offset = 0, limit = 100) => {
  try {
    console.log(`[Get Orders] Loading orders with status ${statusId}, offset: ${offset}, limit: ${limit}`);
    
    // Формируем URL с базовым путем
    const baseUrl = `${CONFIG.MOYSKLAD.API_URL}/entity/customerorder`;
    const url = new URL(baseUrl);
    
    // Добавляем параметры
    const params = {
      expand: 'state,attributes',
      filter: `state=${statusId}`,
      order: 'moment,desc',
      offset: offset,
      limit: limit
    };
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    const fullUrl = url.toString();
    console.log(`[Get Orders] Full request URL: ${fullUrl}`);
    
    // Логируем конфигурацию запроса
    console.log('[Get Orders] Request config:', {
      method: 'GET',
      url: '/entity/customerorder',
      params: params,
      headers: {
        'Authorization': `Bearer ${CONFIG.MOYSKLAD.TOKEN.substring(0, 10)}...`, // Логируем только часть токена
        'Accept': 'application/json;charset=utf-8'
      }
    });
    
    // Делаем запрос только с pathname и search, без дублирования baseUrl
    const response = await moyskladRequest('GET', `/entity/customerorder${url.search}`, null, {});
    
    console.log(`[Get Orders] Received ${response.rows.length} orders`);
    return response.rows;
  } catch (error) {
    console.error('[Get Orders] Detailed error:', {
      message: error.message,
      status: error.response?.status,
      errorData: error.response?.data,
      config: error.config
    });
    throw error;
  }
};

module.exports.handler = async (event, context) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  const corsHeaders = getCorsHeaders(origin);

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    console.log('Incoming request:', {
      method: event.httpMethod,
      path: event.path,
      action: event.queryStringParameters?.action || (event.body ? JSON.parse(event.body).action : 'unknown')
    });

    if (event.httpMethod === 'POST' && event.body) {
      const body = JSON.parse(event.body);
      
      if (body.action === 'login') {
        const { password } = body;
        
        if (password === CONFIG.APP.PASSWORD) {
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ success: true })
          };
        }
        
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, message: 'Invalid password' })
        };
      }

      if (body.action === 'updateRemarkToOffer') {
        try {
          const { orderId, positionsData } = body;
          if (!orderId || !positionsData) {
            throw new Error('Missing required parameters');
          }

          const result = await updateRemarkToOffer(orderId, positionsData);
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ success: true, result })
          };
        } catch (error) {
          console.error('Update REMARK_TO_OFFER error:', error);
          return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              message: 'Failed to update REMARK_TO_OFFER',
              error: error.message
            })
          };
        }
      }

      if (body.action === 'updatePositionStatus') {
        try {
          const { orderIds, positionId, currentProductCode, status, isMerged } = body;
          if (!orderIds || !positionId || !currentProductCode || !status) {
            throw new Error('Missing required parameters');
          }

          const results = [];
          for (const orderId of orderIds) {
            try {
              const result = await updatePositionStatus(orderId, positionId, currentProductCode, status);
              results.push({
                orderId,
                success: true,
                result
              });
            } catch (error) {
              results.push({
                orderId,
                success: false,
                error: error.message
              });
            }
          }

          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
              success: true,
              results
            })
          };
        } catch (error) {
          console.error('Update position status error:', error);
          return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              message: 'Failed to update position status',
              error: error.message
            })
          };
        }
      }

      if (body.action === 'exportExcel') {
        try {
          const { orderId, orderName, positions, isMerged, mergedOrderIds } = body;
          if (!positions) throw new Error('Missing required parameters');

          console.log('Exporting Excel for order:', orderId || 'merged');
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Positions');
          
          worksheet.columns = [
            { header: '№', key: 'index', width: 10 },
            { header: 'Code', key: 'code', width: 20 },
            { header: 'Quantity', key: 'quantity', width: 15 }
          ];
          
          positions.forEach((pos, index) => {
            worksheet.addRow({
              index: pos.index || index + 1,
              code: pos.code,
              quantity: pos.quantity
            });
          });

          const buffer = await workbook.xlsx.writeBuffer();
          const base64Data = buffer.toString('base64');

          if (isMerged && mergedOrderIds && mergedOrderIds.length > 0) {
            console.log('Updating status for merged orders:', mergedOrderIds);
            await updateMergedOrdersStatus(mergedOrderIds, orderName);
          } 
          else if (!isMerged && orderId) {
            await moyskladRequest('PUT', `/entity/customerorder/${orderId}`, {
              attributes: [{
                meta: {
                  type: 'attributemetadata',
                  href: `${CONFIG.MOYSKLAD.API_URL}/entity/customerorder/metadata/attributes/${CONFIG.ATTRIBUTES.BUYER_REMARK}`
                },
                value: 'handled by LXKS'
              }],
              state: {
                meta: {
                  href: `${CONFIG.MOYSKLAD.API_URL}/entity/customerorder/metadata/states/${CONFIG.STATUSES.QUOTATION_IN_PROCESS}`,
                  type: 'state',
                  mediaType: 'application/json'
                }
              }
            });
          }

          return {
            statusCode: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'Content-Disposition': `attachment; filename="${encodeURIComponent(orderName || 'merged_order')}_${new Date().toISOString().slice(0,10)}.xlsx"`
            },
            body: base64Data,
            isBase64Encoded: true
          };
        } catch (error) {
          console.error('Export Excel error:', error);
          return {
            statusCode: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'Export failed',
              error: error.message
            })
          };
        }
      }

      if (body.action === 'uploadFile') {
        try {
          const { orderId, fileName, fileData, isGroup, orderIds } = body;
          if (!fileName || !fileData) {
            throw new Error('Missing required parameters');
          }

          console.log('Starting file upload:', fileName);
          
          let result;
          if (isGroup && orderIds && orderIds.length > 0) {
            console.log('Processing as group of orders:', orderIds);
            result = await uploadFileToOrders(orderIds, fileName, fileData);
          } else {
            if (!orderId) throw new Error('Order ID is required');
            console.log('Processing as single order:', orderId);
            result = await uploadFileToOrders([orderId], fileName, fileData);
          }

          return {
            statusCode: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              success: true,
              result
            })
          };
        } catch (error) {
          console.error('Upload file error:', error);
          return {
            statusCode: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'Upload failed',
              error: error.message
            })
          };
        }
      }

      if (body.action === 'replaceProduct') {
        try {
          const { orderIds, positionId, currentProductCode, newProductCode, isMerged } = body;
          if (!orderIds || !positionId || !currentProductCode || !newProductCode) {
            throw new Error('Missing required parameters');
          }

          let result;
          if (isMerged) {
            result = await replaceProductInGroup(orderIds, positionId, currentProductCode, newProductCode);
          } else {
            result = await replaceProductInOrder(orderIds[0], positionId, currentProductCode, newProductCode);
          }

          return {
            statusCode: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(result)
          };
        } catch (error) {
          console.error('Replace product error:', error);
          return {
            statusCode: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'Failed to replace product',
              error: error.message
            })
          };
        }
      }
    }

    if (event.httpMethod === 'GET') {
      if (event.queryStringParameters?.action === 'listOrders') {
        try {
          const tab = event.queryStringParameters.tab || 'new';
          const offset = parseInt(event.queryStringParameters.offset) || 0;
          const limit = parseInt(event.queryStringParameters.limit) || 100;
          
          console.log(`Listing orders for tab: ${tab}, offset: ${offset}, limit: ${limit}`);
          
          // Определяем статус в зависимости от вкладки
          let statusId;
          switch (tab) {
            case 'new':
              statusId = CONFIG.STATUSES.NEW;
              break;
            case 'quotation':
              statusId = CONFIG.STATUSES.QUOTATION_IN_PROCESS;
              break;
            case 'need_check':
              statusId = CONFIG.STATUSES.NEED_TO_CHECK;
              break;
            default:
              statusId = CONFIG.STATUSES.NEW;
          }

          // Получаем заказы
          const orders = await getOrdersByStatus(statusId, offset, limit);
          
          // Фильтруем по бренду CATERPILLAR
          const catOrders = orders.filter(order => {
            const brandAttr = order.attributes?.find(attr => 
              attr.id === CONFIG.ATTRIBUTES.ORDER_BRAND
            );
            const brand = (brandAttr?.value || '').toLowerCase();
            return ['cat', 'caterpillar', 'ca'].includes(brand);
          });

          // Дополнительная фильтрация для определенных статусов
          const filteredOrders = catOrders.filter(order => {
            if ([CONFIG.STATUSES.QUOTATION_IN_PROCESS, CONFIG.STATUSES.NEED_TO_CHECK].includes(statusId)) {
              const remarkAttr = order.attributes?.find(
                attr => attr.id === CONFIG.ATTRIBUTES.BUYER_REMARK
              );
              return remarkAttr?.value === 'handled by LXKS';
            }
            return true;
          });

          // Сортируем по дате (новые сначала)
          filteredOrders.sort((a, b) => new Date(b.moment) - new Date(a.moment));

          // Добавляем информацию о mergedSO
          const ordersWithMergedSO = filteredOrders.map(order => ({
            ...order,
            mergedSO: order.attributes?.find(attr => attr.id === CONFIG.ATTRIBUTES.MERGED_SO)?.value || null
          }));

          return {
            statusCode: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: true,
              orders: ordersWithMergedSO.map(order => ({
                id: order.id,
                name: order.name,
                date: formatDate(order.moment),
                created: order.moment,
                status: order.state.id === CONFIG.STATUSES.NEW ? 'New' : 
                        order.state.id === CONFIG.STATUSES.QUOTATION_IN_PROCESS ? 'Quotation in Process' : 'Need to Check',
                brand: order.attributes?.find(attr => 
                  attr.id === CONFIG.ATTRIBUTES.ORDER_BRAND
                )?.value || 'Unknown',
                mergedSO: order.mergedSO
              })),
              hasMore: ordersWithMergedSO.length >= limit
            })
          };
        } catch (error) {
          console.error('List orders error:', error);
          return {
            statusCode: error.response?.status || 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'Failed to load orders',
              error: error.response?.data?.errors?.[0]?.error || error.message,
              details: error.response?.data
            })
          };
        }
      }

      if (event.queryStringParameters?.action === 'getOrderPositions') {
        try {
          const orderId = event.queryStringParameters.orderId;
          if (!orderId) throw new Error('Order ID is required');

          console.log('Getting positions for order:', orderId);
          const positions = await moyskladRequest('GET', `/entity/customerorder/${orderId}/positions`, null, {
            expand: 'assortment'
          });

          console.log(`Found ${positions.rows.length} positions`);
          return {
            statusCode: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: true,
              positions: positions.rows.map((item, index) => ({
                id: item.id,
                index: index + 1,
                code: item.assortment?.code || 'N/A',
                quantity: item.quantity || 0,
                name: item.assortment?.name || 'Unknown'
              })),
              orderName: positions.rows[0]?.assortment?.name || 'Order'
            })
          };
        } catch (error) {
          console.error('Get order positions error:', error);
          return {
            statusCode: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'Failed to load positions',
              error: error.response?.data?.errors || error.message
            })
          };
        }
      }

      if (event.queryStringParameters?.action === 'getNeedCheckPositions') {
        try {
          const orderId = event.queryStringParameters.orderId;
          if (!orderId) throw new Error('Order ID is required');

          const result = await getNeedCheckPositions(orderId);
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(result)
          };
        } catch (error) {
          console.error('Get need check positions error:', error);
          return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              message: 'Failed to get need check positions',
              error: error.message
            })
          };
        }
      }

      if (event.queryStringParameters?.action === 'mergeOrders') {
        try {
          const orderIds = event.queryStringParameters.orderIds.split(',');
          if (!orderIds || orderIds.length < 2) {
            throw new Error('At least 2 order IDs are required');
          }

          console.log('Merging orders:', orderIds);
          const result = await mergeOrders(orderIds);

          return {
            statusCode: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: true,
              mergedName: result.mergedName,
              mergedPositions: result.mergedPositions
            })
          };
        } catch (error) {
          console.error('Merge orders error:', error);
          return {
            statusCode: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              success: false,
              message: 'Failed to merge orders',
              error: error.message
            })
          };
        }
      }
    }

    return {
      statusCode: 404,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: false, message: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};
