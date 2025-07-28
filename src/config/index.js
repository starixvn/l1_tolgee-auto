export const Tolgee = {
    url: "https://tolgee.sabagame.com/",
    key: "tgpat_17adn2sbijqjvv6qlserdc5omm4duh3qsfr841pq41brs3dhlq60",
};

export const BaseProjectId = 2;

export const Languages = {
    English: "en",
    Vietnamese: "vi",
    Thailand: "th",
    Indonesia: "id",
    SimplifiedChinese: "zh_cn",
    TraditionalChinese: "zh_tw",
    Philippines: "fil-PH",
    Japanese: "ja",
    Spanish: "es",
};

export const SyncProjects = {
    GameRoundResult: 6,
    GameClient: 5,
};

export const ProjectLanguageCode = {
    [SyncProjects.GameRoundResult]: {
        [Languages.English]: "en-US",
        [Languages.Indonesia]: "id-ID",
        [Languages.Thailand]: "th-TH",
        [Languages.Vietnamese]: "vi-VN",
        [Languages.SimplifiedChinese]: "zh-Hans",
        [Languages.TraditionalChinese]: "zh-Hant",
        [Languages.Philippines]: "fil-PH",
        [Languages.Japanese]: "ja-JP",
        [Languages.Spanish]: "es-ES",
    },
    [SyncProjects.GameClient]: {
        [Languages.English]: "en",
        [Languages.Indonesia]: "id",
        [Languages.Thailand]: "th",
        [Languages.Vietnamese]: "vi",
        [Languages.SimplifiedChinese]: "zh_cn",
        [Languages.TraditionalChinese]: "zh_tw",
        [Languages.Philippines]: "fil-PH",
        [Languages.Japanese]: "ja",
        [Languages.Spanish]: "es",
    },
};
