const url = "https://cipherstore.online/api/checkout";
async function test() {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Bot Test",
            email: "bottest@example.com",
            phone: "01000000000",
            items: [{ productId: "123", quantity: 1, price: 10, total: 10, name: "Test Item", product: { deliveryType: "MANUAL" } }],
            total: 10,
            paymentMethod: "VODAFONE"
        })
    });
    const data = await res.json();
    console.log("Response from Live Website:", data);
}
test();
