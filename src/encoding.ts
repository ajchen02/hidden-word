const VARIATION_SELECTOR_START = 0xfe00;
const VARIATION_SELECTOR_END = 0xfe0f;

const VARIATION_SELECTOR_SUPPLEMENT_START = 0xe0100;
const VARIATION_SELECTOR_SUPPLEMENT_END = 0xe01ef;

/**
 * 将字节转换为变体选择器
 * @param {number} byte - 要转换的字节
 * @returns {string|null} - 变体选择器字符或null
 */
export function toVariationSelector(byte) {
    if (byte >= 0 && byte < 16) {
        return String.fromCodePoint(VARIATION_SELECTOR_START + byte);
    } else if (byte >= 16 && byte < 256) {
        return String.fromCodePoint(VARIATION_SELECTOR_SUPPLEMENT_START + byte - 16);
    } else {
        return null;
    }
}

/**
 * 从变体选择器转换为字节
 * @param {number} codePoint - 变体选择器的码点
 * @returns {number|null} - 字节或null
 */
export function fromVariationSelector(codePoint) {
    if (codePoint >= VARIATION_SELECTOR_START && codePoint <= VARIATION_SELECTOR_END) {
        return codePoint - VARIATION_SELECTOR_START;
    } else if (
        codePoint >= VARIATION_SELECTOR_SUPPLEMENT_START &&
        codePoint <= VARIATION_SELECTOR_SUPPLEMENT_END
    ) {
        return codePoint - VARIATION_SELECTOR_SUPPLEMENT_START + 16;
    } else {
        return null;
    }
}

/**
 * 将文本编码到一段文本中
 * @param {string} text - 要隐藏的文本
 * @param {string} carrier - 承载隐藏文本的文本
 * @returns {string} - 编码后的文本
 */
export function encode(text, carrier) {
    // 将字符串转换为utf-8字节
    const bytes = new TextEncoder().encode(text);

    // 如果carrier是空字符串，使用默认字符
    if (!carrier || carrier.length === 0) {
        carrier = "A";
    }

    // 将字节分布到carrier的每个字符中
    const carrierChars = Array.from(carrier);
    let result = "";

    // 如果隐藏文字字节少于载体文本，使用随机算法分散
    if (bytes.length <= carrierChars.length) {
        // 创建一个随机位置数组，用于随机分布字节
        const positions = [];
        for (let i = 0; i < carrierChars.length; i++) {
            positions.push(i);
        }

        // 随机打乱位置数组
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        // 选择前bytes.length个位置用于插入变体选择器
        const selectedPositions = positions.slice(0, bytes.length);
        selectedPositions.sort((a, b) => a - b); // 重新排序，以便按顺序处理

        // 构建结果字符串，在选定的位置插入变体选择器
        let byteIndex = 0;
        for (let i = 0; i < carrierChars.length; i++) {
            //console.log(result);
            result += carrierChars[i];

            // 检查当前位置是否是选定的位置之一
            if (selectedPositions.includes(i) && byteIndex < bytes.length) {
                const selector = toVariationSelector(bytes[byteIndex]);
                if (selector) {
                    result += selector;
                }
                byteIndex++;
            }
        }
    } else {
        // 如果隐藏文字字节多于载体文本，将多余的字节叠加到最后一个字符
        let byteIndex = 0;

        // 先处理能均匀分配到载体字符的字节
        for (let i = 0; i < carrierChars.length; i++) {
            result += carrierChars[i];

            // 如果还有字节需要处理
            if (byteIndex < bytes.length) {
                const selector = toVariationSelector(bytes[byteIndex]);
                if (selector) {
                    result += selector;
                }
                byteIndex++;
            }
        }

        // 将剩余的字节全部叠加到最后一个字符
        while (byteIndex < bytes.length) {
            const selector = toVariationSelector(bytes[byteIndex]);
            if (selector) {
                result += selector;
            }
            byteIndex++;
        }
    }

    return result;
}

/**
 * 从编码文本中解码隐藏的文本
 * @param {string} encodedText - 编码后的文本
 * @returns {string} - 解码后的文本
 */
export function decode(encodedText) {
    const decoded = [];
    const chars = Array.from(encodedText);

    // 遍历每个字符，检查其后是否有变体选择器
    for (let i = 0; i < chars.length; i++) {
        // 检查当前字符后的所有连续变体选择器
        while (i + 1 < chars.length) {
            const nextChar = chars[i + 1] as string;
            const byte = fromVariationSelector(nextChar.codePointAt(0));

            if (byte !== null) {
                decoded.push(byte);
                i++; // 跳过已处理的变体选择器
            } else {
                break; // 如果不是变体选择器，退出内部循环
            }
        }
    }

    // 将字节数组转换回字符串
    const decodedArray = new Uint8Array(decoded);
    return new TextDecoder().decode(decodedArray);
}