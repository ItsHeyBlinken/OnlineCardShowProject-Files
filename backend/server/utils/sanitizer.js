const sanitizeOrderInput = (input) => ({
    ...input,
    items: input.items?.map(item => ({
        ...item,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity),
        id: parseInt(item.id)
    })),
    tax: parseFloat(input.tax || 0),
    subtotal: parseFloat(input.subtotal || 0),
    taxRate: parseFloat(input.taxRate || 0)
});

module.exports = {
    sanitizeOrderInput
}; 