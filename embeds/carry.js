import { MessageComponentTypes } from "discord-interactions";
import { IsleofDucks } from "../utils/discordUtils.js";

export default {
    content: null,
    embeds: [
        {
            title: "Temporary Carry Embed",
            description: "Use this to create a carry ticket. Not the embed above.",
            color: parseInt("FB9B00", 16),
            fields: [
                {
                    name: "Encountered an error?",
                    value: `* Create a support ticket here: <#${IsleofDucks.channels.support}>\n* Ping <@${IsleofDucks.staticIDs.Jforjo}>.\n* Explain the error in detail and provide screenshots.`,
                }
            ]
        }
    ],
    components: [
        {
            type: MessageComponentTypes.ACTION_ROW,
            components: [
                {
                    type: MessageComponentTypes.STRING_SELECT,
                    custom_id: "carry_select",
                    placeholder: "Carry Services",
                    // How many can be selected at once (25 is max)
                    max_values: 1,
                    options: [
                        {
                            label: "F1-4",
                            value: "f1_4",
                            description: "Required Catacombs Level: (Various 1-9)",
                            emoji: {
                                name: "f1",
                                id: "1292508326718079088"
                            }
                        },
                        {
                            label: "F5-6",
                            value: "f5_6",
                            description: "Required Catacombs Level: (Various 14-19)",
                            emoji: {
                                name: "f5",
                                id: "1292508381084520570"
                            }
                        },
                        {
                            label: "F7",
                            value: "f7",
                            description: "Required Catacombs Level: 24",
                            emoji: {
                                name: "f7",
                                id: "1292508411484704768"
                            }
                        },
                        {
                            label: "M1",
                            value: "m1",
                            description: "Required Catacombs Level: 24",
                            emoji: {
                                name: "m1",
                                id: "1292508426311831602"
                            }
                        },
                        {
                            label: "M2",
                            value: "m2",
                            description: "Required Catacombs Level: 26",
                            emoji: {
                                name: "m2",
                                id: "1292508438080917605"
                            }
                        },
                        {
                            label: "M3",
                            value: "m3",
                            description: "Required Catacombs Level: 28",
                            emoji: {
                                name: "m3",
                                id: "1292508451469267025"
                            }
                        },
                        {
                            label: "M4",
                            value: "m4",
                            description: "Required Catacombs Level: 30",
                            emoji: {
                                name: "m4",
                                id: "1292508464580399135"
                            }
                        },
                        {
                            label: "M5",
                            value: "m5",
                            description: "Required Catacombs Level: 32",
                            emoji: {
                                name: "m5",
                                id: "1292508476572045413"
                            }
                        },
                        {
                            label: "M6",
                            value: "m6",
                            description: "Required Catacombs Level: 34",
                            emoji: {
                                name: "m6",
                                id: "1292508489632972841"
                            }
                        },
                        {
                            label: "M7",
                            value: "m7",
                            description: "Required Catacombs Level: 36",
                            emoji: {
                                name: "m7",
                                id: "1292508502190981180"
                            }
                        },
                        {
                            label: "Revenant Horror T1-5",
                            value: "rev",
                            description: "You must have completed previous bosses.",
                            emoji: {
                                name: "rev5",
                                id: "1292512154359955609"
                            }
                        },
                        {
                            label: "Tarantula Broodfather T1-4",
                            value: "tara",
                            description: "You must have completed previous bosses.",
                            emoji: {
                                name: "tara",
                                id: "1292512184311611432"
                            }
                        },
                        {
                            label: "Sven Packmaster T1-4",
                            value: "sven",
                            description: "You must have completed previous bosses.",
                            emoji: {
                                name: "sven",
                                id: "1292512169816232046"
                            }
                        },
                        {
                            label: "Voidgloom Seraph T1-3",
                            value: "eman",
                            description: "You must have completed previous bosses.",
                            emoji: {
                                name: "eman",
                                id: "1292512333662519366"
                            }
                        },
                        {
                            label: "Voidgloom Seraph T4",
                            value: "eman4",
                            description: "You must have completed previous bosses.",
                            emoji: {
                                name: "eman",
                                id: "1292512333662519366"
                            }
                        },
                        {
                            label: "Inferno Demonlord T1-3",
                            value: "inferno",
                            description: "You must have completed previous bosses.",
                            emoji: {
                                name: "inferno",
                                id: "1292513463176007690"
                            }
                        },
                        {
                            label: "Inferno Demonlord T4",
                            value: "inferno4",
                            description: "You must have completed previous bosses.",
                            emoji: {
                                name: "inferno",
                                id: "1292513463176007690"
                            }
                        },
                        {
                            label: "Kuudra T1 (Basic)",
                            value: "kuudrabasic",
                            description: "Required Reputation: 0",
                            emoji: {
                                name: "kuudrabasic",
                                id: "1292512388750377030"
                            }
                        },
                        {
                            label: "Kuudra T2 (Hot)",
                            value: "kuudrahot",
                            description: "Required Reputation: 1000",
                            emoji: {
                                name: "kuudrahot",
                                id: "1292512414243356783"
                            }
                        },
                        {
                            label: "Kuudra T3 (Burning)",
                            value: "kuudraburning",
                            description: "Required Reputation: 3000",
                            emoji: {
                                name: "kuudraburning",
                                id: "1292512440101113857"
                            }
                        },
                        {
                            label: "Kuudra T4 (Fiery)",
                            value: "kuudrafiery",
                            description: "Required Reputation: 7000",
                            emoji: {
                                name: "kuudrafiery",
                                id: "1292512455800524912"
                            }
                        },
                        {
                            label: "Kuudra T5 (Infernal)",
                            value: "kuudrainfernal",
                            description: "Required Reputation: 12000",
                            emoji: {
                                name: "kuudrainfernal",
                                id: "1292512475413086282"
                            }
                        }
                    ],
                }
            ]
        }
    ]
}