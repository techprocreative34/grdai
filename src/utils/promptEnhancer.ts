// src/utils/promptEnhancer.ts
const indonesianKeywords = {
    lighting: ['cahaya emas fajar', 'sinar matahari tropis', 'pencahayaan hangat remang', 'neon khas perkotaan', 'pencahayaan dramatis'],
    atmosphere: ['dengan nuansa Indonesia yang kental', 'dalam suasana nusantara yang otentik', 'menangkap kehangatan tropis'],
    quality: ['detail tajam', 'resolusi tinggi 8k', 'kualitas fotorealistis', 'mahakarya', 'trending di ArtStation', 'hyper-detailed'],
    composition: ['komposisi seimbang', 'sudut sinematik', 'framing sempurna oleh alam', 'golden ratio']
};

const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export class IndonesianPromptEnhancer {
    static enhance(userInput: string): string {
        if (!userInput) return ''; // Jangan enhance jika input kosong
        let enhanced = userInput;

        // Tambahkan 1-2 kata kunci teknis/kualitas secara acak untuk menghindari terlalu ramai
        enhanced += `, ${getRandomElement(indonesianKeywords.quality)}`;
        enhanced += `, ${getRandomElement(indonesianKeywords.lighting)}`;
        if (Math.random() > 0.5) { // 50% kemungkinan menambahkan keyword komposisi
             enhanced += `, ${getRandomElement(indonesianKeywords.composition)}`;
        }

        return enhanced;
    }
}