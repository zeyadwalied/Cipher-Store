const url = "https://discord.com/api/webhooks/1485459046541820017/qI8gsSHFQJ0e4YR4IPtoYyMVFDKxEGVE0748avgqSR2NAFk-KnLpzK-sk9BkuN_FTCEG";

async function testUpload() {
    const fileBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
    const fileBlob = new Blob([fileBytes], { type: "image/png" });

    const form = new FormData();
    form.append("file", fileBlob, "test.png");
    form.append("content", "Test upload");

    const res = await fetch(url + "?wait=true", {
        method: "POST",
        body: form
    });

    const json = await res.json();
    console.log("Status:", res.status);
    console.log("JSON:", JSON.stringify(json, null, 2));
}

testUpload();
