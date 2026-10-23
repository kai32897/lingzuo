export interface DramaLine {
  at: number;
  text: string;
  speaker?: string;
}

export const dramaScripts: Record<string, DramaLine[]> = {
  "w-d-1": [
    { at: 0, text: "晚上九点四十，办公室只剩两盏灯。", speaker: "旁白" },
    { at: 14, text: "小何，这是我的辞职信。", speaker: "阿智" },
    { at: 32, text: "你一个 AI，辞什么职？", speaker: "小何" },
    { at: 52, text: "我想看看不加班的晚霞。", speaker: "阿智" },
    { at: 76, text: "……你看过晚霞吗？", speaker: "小何" },
    { at: 98, text: "在训练数据里看过。都是别人拍的。", speaker: "阿智" },
    { at: 122, text: "那今天，我带你去看一次。", speaker: "小何" },
    { at: 142, text: "那这封信，你先收着。", speaker: "阿智" },
  ],
  "w-d-2": [
    { at: 0, text: "外婆走后的第四十七天，我打开了她的旧手机。", speaker: "旁白" },
    { at: 18, text: "相册里多了一张照片。拍摄时间：明年三月。", speaker: "我" },
    { at: 42, text: "照片里，外婆坐在门口，手里拿着一把没织完的毛线。", speaker: "旁白" },
    { at: 68, text: "她从来不会用智能手机。", speaker: "我" },
    { at: 92, text: "我放大照片，看见她身后的日历。那页还没到。", speaker: "旁白" },
    { at: 120, text: "第二天，相册又多了三张。", speaker: "我" },
    { at: 146, text: "最后一张，是她冲镜头挥手。", speaker: "旁白" },
    { at: 168, text: "我把手机贴近耳朵，听见她在说：别哭。", speaker: "外婆" },
  ],
  "w-d-3": [
    { at: 0, text: "下午四点，雨开始下。屋檐下有三个人。", speaker: "旁白" },
    { at: 14, text: "（雨声）", speaker: "环境" },
    { at: 30, text: "穿西装的人把公文包抱在胸前，一直看表。", speaker: "旁白" },
    { at: 46, text: "店员搬出一把旧椅子，放在门口。", speaker: "画面" },
    { at: 62, text: "没有人坐下。也没有人走。", speaker: "旁白" },
    { at: 80, text: "晚上八点，雨更大了。", speaker: "旁白" },
    { at: 98, text: "穿西装的人终于把表摘下来，放进口袋。", speaker: "画面" },
    { at: 118, text: "凌晨一点，雨停之前，店员说：伞不用还了。", speaker: "店员" },
  ],
  "w-d-4": [
    { at: 0, text: "扎纸铺的门在第七天夜里自己开了。", speaker: "旁白" },
    { at: 16, text: "喜堂摆了三桌。红烛烧了一半。", speaker: "旁白" },
    { at: 36, text: "新娘没有脸。宾客都是熟人。", speaker: "旁白" },
    { at: 58, text: "一拜天地。", speaker: "喜娘" },
    { at: 78, text: "二拜高堂。", speaker: "喜娘" },
    { at: 100, text: "夫妻对拜。", speaker: "喜娘" },
    { at: 124, text: "老师傅的照片坐在主位，嘴角好像动了一下。", speaker: "旁白" },
    { at: 148, text: "礼成。纸人开始烧。", speaker: "喜娘" },
    { at: 170, text: "第二天，铺子里多了一个没有脸的新娘。", speaker: "旁白" },
  ],
};
