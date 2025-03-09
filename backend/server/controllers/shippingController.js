const pool = require('../db');

/**
 * Get available shipping methods
 */
const getShippingMethods = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, display_name, provider, service_code, description 
       FROM shipping_methods 
       WHERE is_active = true
       ORDER BY provider, display_name`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Calculate shipping costs taking into account seller preferences
 * Request body should include:
 * - items: array of items with weight, dimensions, and seller_id
 * - shipping_method_id: the selected shipping method
 * - to_zipcode: destination zip code
 */
const calculateShippingCost = async (req, res) => {
  const { items, shipping_method_id, to_zipcode } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No items provided' });
  }
  
  try {
    // Get the shipping method
    const methodResult = await pool.query(
      `SELECT id, name, provider, service_code 
       FROM shipping_methods 
       WHERE id = $1`,
      [shipping_method_id]
    );
    
    if (methodResult.rows.length === 0) {
      return res.status(404).json({ message: 'Shipping method not found' });
    }
    
    const shippingMethod = methodResult.rows[0];
    
    // Group items by seller
    const itemsBySeller = {};
    for (const item of items) {
      if (!item.seller_id) {
        return res.status(400).json({ message: 'Seller ID is required for each item' });
      }
      
      if (!itemsBySeller[item.seller_id]) {
        itemsBySeller[item.seller_id] = [];
      }
      
      itemsBySeller[item.seller_id].push(item);
    }
    
    // Get seller profiles to check shipping preferences
    const sellerIds = Object.keys(itemsBySeller);
    
    const sellerResult = await pool.query(
      `SELECT sp.user_id, sp.offers_free_shipping, sp.standard_shipping_fee, sp.uses_calculated_shipping
       FROM seller_profiles sp
       WHERE sp.user_id = ANY($1)`,
      [sellerIds]
    );
    
    // Create a map of seller shipping preferences
    const sellerShippingPrefs = {};
    for (const seller of sellerResult.rows) {
      sellerShippingPrefs[seller.user_id] = {
        offers_free_shipping: seller.offers_free_shipping || false,
        standard_shipping_fee: parseFloat(seller.standard_shipping_fee || 0),
        uses_calculated_shipping: seller.uses_calculated_shipping || false
      };
    }
    
    // Calculate shipping cost for each seller
    let totalCost = 0;
    const shippingBreakdown = [];
    
    for (const sellerId in itemsBySeller) {
      const sellerItems = itemsBySeller[sellerId];
      const sellerPrefs = sellerShippingPrefs[sellerId] || {
        offers_free_shipping: false,
        standard_shipping_fee: 0,
        uses_calculated_shipping: false
      };
      
      let sellerShippingCost = 0;
      
      // Check if the seller offers free shipping
      if (sellerPrefs.offers_free_shipping) {
        sellerShippingCost = 0;
      } 
      // Check if the seller has a standard shipping fee
      else if (sellerPrefs.standard_shipping_fee > 0) {
        sellerShippingCost = sellerPrefs.standard_shipping_fee;
      }
      // Otherwise, calculate based on weight and shipping method
      else if (sellerPrefs.uses_calculated_shipping) {
        // Calculate total weight for this seller's items
        const totalWeight = sellerItems.reduce((sum, item) => sum + (item.weight_oz || 4) * item.quantity, 0);
        
        // For demo purposes, calculate a simple cost based on weight and shipping method
        // In a real implementation, you would call an actual shipping API
        if (shippingMethod.provider === 'USPS') {
          // USPS simplified calculation
          if (totalWeight <= 16) { // 1 pound or less
            sellerShippingCost = 4.50;
          } else if (totalWeight <= 32) { // 2 pounds or less
            sellerShippingCost = 5.50;
          } else {
            sellerShippingCost = 7.50 + (Math.floor(totalWeight / 16) - 2) * 1.25;
          }
        } else if (shippingMethod.provider === 'UPS') {
          // UPS simplified calculation
          if (totalWeight <= 16) { // 1 pound or less
            sellerShippingCost = 7.50;
          } else if (totalWeight <= 32) { // 2 pounds or less
            sellerShippingCost = 9.50;
          } else {
            sellerShippingCost = 12.50 + (Math.floor(totalWeight / 16) - 2) * 2.25;
          }
        } else if (shippingMethod.provider === 'FedEx') {
          // FedEx simplified calculation
          if (totalWeight <= 16) { // 1 pound or less
            sellerShippingCost = 8.50;
          } else if (totalWeight <= 32) { // 2 pounds or less
            sellerShippingCost = 10.50;
          } else {
            sellerShippingCost = 14.50 + (Math.floor(totalWeight / 16) - 2) * 2.50;
          }
        }
      } else {
        // Default shipping fee if seller has no preferences set
        sellerShippingCost = 5.00;
      }
      
      totalCost += sellerShippingCost;
      
      // Add to the breakdown
      shippingBreakdown.push({
        seller_id: sellerId,
        item_count: sellerItems.length,
        free_shipping: sellerPrefs.offers_free_shipping,
        shipping_cost: sellerShippingCost
      });
    }
    
    // Return the calculated cost with breakdown
    res.json({
      shipping_method_id,
      provider: shippingMethod.provider,
      service: shippingMethod.name,
      cost: totalCost,
      estimated_delivery_days: shippingMethod.provider === 'USPS' ? 3 : (shippingMethod.provider === 'UPS' ? 2 : 1),
      breakdown: shippingBreakdown
    });
  } catch (error) {
    console.error('Error calculating shipping cost:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get seller shipping policy
 */
const getSellerShippingPolicy = async (req, res) => {
  const { sellerId } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT offers_free_shipping, standard_shipping_fee, shipping_policy, uses_calculated_shipping
       FROM seller_profiles
       WHERE user_id = $1`,
      [sellerId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching seller shipping policy:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update seller shipping preferences
 */
const updateSellerShippingPolicy = async (req, res) => {
  const { sellerId } = req.params;
  const { offers_free_shipping, standard_shipping_fee, shipping_policy, uses_calculated_shipping } = req.body;
  
  // Ensure the user can only update their own shipping preferences
  if (req.user.id !== parseInt(sellerId) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  
  try {
    const result = await pool.query(
      `UPDATE seller_profiles
       SET offers_free_shipping = $1,
           standard_shipping_fee = $2,
           shipping_policy = $3,
           uses_calculated_shipping = $4
       WHERE user_id = $5
       RETURNING *`,
      [
        offers_free_shipping || false,
        standard_shipping_fee || 0,
        shipping_policy || '',
        uses_calculated_shipping || false,
        sellerId
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Seller profile not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating seller shipping policy:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getShippingMethods,
  calculateShippingCost,
  getSellerShippingPolicy,
  updateSellerShippingPolicy
}; 