const Jimp = require('jimp');

async function removeWhite() {
    try {
        const image = await Jimp.read(process.argv[2]);
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];
            // If pixel is near white
            if (red > 230 && green > 230 && blue > 230) {
                this.bitmap.data[idx + 3] = 0; // set alpha to 0
            }
        });
        await image.writeAsync(process.argv[3]);
        console.log("Background removed successfully!");
    } catch (err) {
        console.error(err);
    }
}

removeWhite();
