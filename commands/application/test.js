import { InteractionResponseType } from "discord-interactions";
import { ApplicationCommandOptionType, ApplicationCommandType } from "discord-api-types/v10";
import { ConvertSnowflakeToDate } from "../../utils/discordUtils.js";
import { sql } from "@vercel/postgres";

const catalevels = {
    1: 50, 2: 125, 3: 235, 4: 395, 5: 625, 6: 955, 7: 1425, 8: 2095, 9: 3045,
    10: 4385, 11: 6275, 12: 8940, 13: 12700, 14: 17960, 15: 25340, 16: 35640,
    17: 50040, 18: 70040, 19: 97640, 20: 135640, 21: 188140, 22: 259640, 23: 356640,
    24: 488640, 25: 668640, 26: 911640, 27: 1239640, 28: 1684640, 29: 2284640,
    30: 3084640, 31: 4149640, 32: 5559640, 33: 7459640, 34: 9959640, 35: 13259640,
    36: 17559640, 37: 23159640, 38: 30359640, 39: 39559640, 40: 51559640, 41: 66559640,
    42: 85559640, 43: 109559640, 44: 139559640, 45: 177559640, 46: 225559640,
    47: 285559640, 48: 360559640, 49: 453559640, 50: 569809640, 51: 769809640,
    52: 967809640, 53: 1167809640, 54: 1367809640, 55: 1567809640, 56: 1767809640,
    57: 1967809640, 58: 2167809640, 59: 2367809640, 60: 2567809640, 61: 2767809640,
    62: 2967809640, 63: 3167809640, 64: 3367809640, 65: 3567809640, 66: 3767809640,
    67: 3967809640, 68: 4167809640, 69: 4367809640, 70: 4567809640, 71: 4767809640,
    72: 4967809640, 73: 5167809640, 74: 5367809640, 75: 5567809640, 76: 5767809640,
    77: 5967809640, 78: 6167809640, 79: 6367809640, 80: 6567809640, 81: 6767809640,
    82: 6967809640, 83: 7167809640, 84: 7367809640, 85: 7567809640, 86: 7767809640,
    87: 7967809640, 88: 8167809640, 89: 8367809640, 90: 8567809640, 91: 8767809640,
    92: 8967809640, 93: 9167809640, 94: 9367809640, 95: 9567809640, 96: 9767809640,
    97: 9967809640, 98: 10167809640, 99: 10367809640, 100: 10567809640,
};
function calcCataLevel(cataxp) {
    let catalvl = 0;
    for (const [key, value] of Object.entries(catalevels)) {
        if (cataxp < value) {
            catalvl += (cataxp - (catalevels[key - 1] ?? 0)) / (value - (catalevels[key - 1] ?? 0));
            break;
        }
        catalvl++;
    }
    return catalvl;
}

async function UpdateDatabase() {
    const { rows } = await sql`SELECT * FROM users`;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const catalvl = calcCataLevel(row.cataxp);
        let oldlvl = catalvl;
        if (row.oldxp != null) {
            oldlvl = calcCataLevel(row.oldxp);
        }
        await sql`UPDATE users SET (cataxp, oldxp) = (${catalvl}, ${oldxp}) WHERE uuid = ${row.uuid}`;
    }
}

export default async (req, res) => {
    const interaction = req.body;
    const timestamp = ConvertSnowflakeToDate(interaction.id);
    return res.status(200).send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
            content: null,
            embeds: [
                {
                    title: `Test!`,
                    description: `test\n# Heading (#)\n## Subheading (##)\n### Sub-subheading (###)\n-# Small text (-#)\ntest`,
                    color: parseInt("FF69B4", 16),
                    footer: {
                        text: `Response time: ${Date.now() - timestamp.getTime()}ms`,
                    },
                    timestamp: new Date().toISOString()
                }
            ],
        },
    });
}
export const CommandData = {
    name: "test",
    description: "Test command! It's response will change overtime for testing purposes.",
    type: ApplicationCommandType.ChatInput,
}