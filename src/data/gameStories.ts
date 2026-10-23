export interface GameChoice {
  label: string;
  next: string;
}

export interface GameScene {
  id: string;
  title: string;
  text: string;
  choices?: GameChoice[];
  endingLabel?: string;
}

export interface GameStory {
  start: string;
  scenes: Record<string, GameScene>;
}

export const gameStories: Record<string, GameStory> = {
  "w-g-1": {
    start: "night-1",
    scenes: {
      "night-1": {
        id: "night-1",
        title: "23:00 / 关东煮前面",
        text: "他站在关东煮前面，已经十分钟了。锅里只剩最后一串萝卜。收银台的灯有点闪，外面在下雨。",
        choices: [
          { label: "先补货", next: "restock" },
          { label: "先结账", next: "checkout" },
        ],
      },
      restock: {
        id: "restock",
        title: "01 / 补货",
        text: "你蹲下去拆纸箱，听见他把伞收起来，水滴了一地。再抬头时，他没有拿萝卜，只把一张折得很小的纸放在柜台上。",
        choices: [
          { label: "打开那张纸", next: "note" },
          { label: "先把萝卜递给他", next: "radish" },
        ],
      },
      note: {
        id: "note",
        title: "02 / 那张纸",
        text: "纸上是一份排班表，日期是三年前。最后一行被人用红笔圈出来：夜班，陈九。那是你的名字。",
        choices: [{ label: "把纸还给他", next: "end-night" }],
      },
      radish: {
        id: "radish",
        title: "02 / 最后一串萝卜",
        text: "他接过去，说了声谢谢，却没有吃。他把萝卜放回锅里，说：「留给明天早班的人吧。」然后推门走了。",
        choices: [{ label: "关灯", next: "end-morning" }],
      },
      checkout: {
        id: "checkout",
        title: "01 / 结账",
        text: "他把口袋里最后一样东西放在柜台上：一枚很旧的硬币，边缘磨得发亮。他说：「这个先押着。」",
        choices: [
          { label: "收下硬币", next: "coin" },
          { label: "把硬币还给他", next: "return" },
        ],
      },
      coin: {
        id: "coin",
        title: "02 / 硬币",
        text: "硬币背面刻着一行小字：下次再来。你抬头时，他已经走到雨里。收银机自己响了一声，抽屉弹开，里面是空的。",
        choices: [{ label: "把硬币放进去", next: "end-rain" }],
      },
      return: {
        id: "return",
        title: "02 / 还给他",
        text: "你把硬币塞回他手里。他愣了一下，笑了：「那下次我带够钱再来。」门上的铃响了两下，雨声灌进来。",
        choices: [{ label: "继续值夜班", next: "end-morning" }],
      },
      "end-night": {
        id: "end-night",
        title: "结局 / 夜班",
        text: "你把排班表折好，放进口袋。关东煮的汤还在冒热气。你忽然想起来，三年前的那个夜班，好像也是这样一个雨天。",
        endingLabel: "结局：夜班还没结束",
      },
      "end-morning": {
        id: "end-morning",
        title: "结局 / 早班",
        text: "天亮的时候，早班的人来了。锅里的萝卜还在，汤少了一点。你交班，推门出去，雨已经停了。",
        endingLabel: "结局：留给明天的人",
      },
      "end-rain": {
        id: "end-rain",
        title: "结局 / 雨",
        text: "硬币落进抽屉，声音很轻。你站在收银台后面，看着玻璃上的雨痕，觉得今晚可能不会再有客人了。",
        endingLabel: "结局：押着",
      },
    },
  },
  "w-g-2": {
    start: "elevator-1",
    scenes: {
      "elevator-1": {
        id: "elevator-1",
        title: "00:13 / 电梯",
        text: "电梯在 12 楼停了一下，门没开，又继续往上。楼层显示跳到 13。你住这栋楼三年，从来不知道 13 楼有什么。",
        choices: [
          { label: "走出去", next: "corridor" },
          { label: "按住关门键", next: "close-door" },
        ],
      },
      corridor: {
        id: "corridor",
        title: "13 楼 / 走廊",
        text: "走廊的灯只亮了一半。1303 的门虚掩着，门缝里传来电视的声音。走廊尽头有一面镜子，镜子里的人比你慢半拍。",
        choices: [
          { label: "敲 1303 的门", next: "knock" },
          { label: "走到镜子前", next: "mirror" },
        ],
      },
      knock: {
        id: "knock",
        title: "1303 / 门后",
        text: "开门的是你自己。他穿着你昨天的衣服，说：「你终于来了。今晚轮到你看门。」",
        choices: [{ label: "走进去", next: "end-inside" }],
      },
      mirror: {
        id: "mirror",
        title: "镜子 / 慢半拍",
        text: "镜子里的人抬手，你还没抬。他隔着玻璃说：「别按 14 楼。那里没有按钮。」",
        choices: [{ label: "回电梯", next: "end-back" }],
      },
      "close-door": {
        id: "close-door",
        title: "第二晚 / 电梯",
        text: "第二天同一时间，电梯又停在 13 楼。这一次，按钮自己亮了。你听见门外有人用你的声音说：「别按关门。」",
        choices: [
          { label: "按开门", next: "corridor" },
          { label: "按 1 楼", next: "end-down" },
        ],
      },
      "end-inside": {
        id: "end-inside",
        title: "结局 / 看门",
        text: "门在你身后关上。客厅里摆着一张和你家一模一样的沙发。电视里在放一档深夜节目，主持人说：欢迎 13 楼的新住户。",
        endingLabel: "结局：13 楼",
      },
      "end-back": {
        id: "end-back",
        title: "结局 / 回电梯",
        text: "你退回电梯，按了 12 楼。门关上的最后一秒，你看见镜子里的人还站在原地，冲你摆了摆手。",
        endingLabel: "结局：慢半拍",
      },
      "end-down": {
        id: "end-down",
        title: "结局 / 1 楼",
        text: "电梯一路向下，没有再停。第二天，你搬走了。新家的电梯只有 12 层，但你偶尔还是会在午夜听见一声很轻的「叮」。",
        endingLabel: "结局：搬家",
      },
    },
  },
  "w-g-3": {
    start: "cat-1",
    scenes: {
      "cat-1": {
        id: "cat-1",
        title: "客厅 / 猫",
        text: "猫躺在窗台上，说：「我一点都不想被摸。」屋子里的钟敲了一下。你知道，这间屋子只说真话。",
        choices: [
          { label: "摸它", next: "touch" },
          { label: "不摸", next: "no-touch" },
        ],
      },
      touch: {
        id: "touch",
        title: "猫 / 呼噜",
        text: "你伸手，它立刻打起呼噜，又马上停住，说：「我讨厌这样。」屋子说：它在说谎。",
        choices: [
          { label: "继续摸", next: "purr" },
          { label: "问它想要什么", next: "ask" },
        ],
      },
      "no-touch": {
        id: "no-touch",
        title: "猫 / 背影",
        text: "你收回手。猫看了你一会儿，跳下窗台，走到门口，回头说：「我永远不会回来。」",
        choices: [
          { label: "打开门", next: "open-door" },
          { label: "堵住门", next: "block" },
        ],
      },
      purr: {
        id: "purr",
        title: "猫 / 呼噜",
        text: "它把脑袋往你手心里顶，声音越来越小，最后说：「我一点都不喜欢这个家。」屋子没有纠正它。",
        choices: [{ label: "把它抱起来", next: "end-warm" }],
      },
      ask: {
        id: "ask",
        title: "猫 / 问题",
        text: "你问它想要什么。它沉默了很久，说：「我什么都不想要。」屋子轻轻响了一声，像在叹气。",
        choices: [{ label: "给它一碗水", next: "end-water" }],
      },
      "open-door": {
        id: "open-door",
        title: "门 / 外面",
        text: "门开了，外面不是走廊，是一片很亮的草地。猫站在门口，没有出去，只说：「我走了。」",
        choices: [{ label: "关上门", next: "end-stay" }],
      },
      block: {
        id: "block",
        title: "门 / 你",
        text: "你挡在门前。猫抬头看你，忽然不说话了。屋子说：它现在说的是真话。",
        choices: [{ label: "让开", next: "end-stay" }],
      },
      "end-warm": {
        id: "end-warm",
        title: "结局 / 呼噜",
        text: "猫在你怀里睡着了。屋子安静下来。你忽然分不清，到底是谁在陪谁。",
        endingLabel: "结局：反话",
      },
      "end-water": {
        id: "end-water",
        title: "结局 / 一碗水",
        text: "猫喝了两口，把爪子搭在碗边，说：「我明天不会再来。」第二天，它还是来了。",
        endingLabel: "结局：明天",
      },
      "end-stay": {
        id: "end-stay",
        title: "结局 / 留下",
        text: "猫没有走。它跳回窗台，背对着你，尾巴轻轻晃了一下。屋子说：它很开心。猫说：我没有。",
        endingLabel: "结局：真话",
      },
    },
  },
  "w-g-4": {
    start: "road-1",
    scenes: {
      "road-1": {
        id: "road-1",
        title: "末日 / 第 1 站",
        text: "包裹上没有收件人，只有一行地址：送到你还记得的地方。你骑着车，后座绑着它。前面是最后一个还亮着的加油站。",
        choices: [
          { label: "继续送", next: "station" },
          { label: "拆开看看", next: "open" },
        ],
      },
      station: {
        id: "station",
        title: "加油站 / 老人",
        text: "老人给你加满油，问：「送谁的？」你说不知道。他说：「那你还送。」他递给你一瓶水，瓶身上写着一个名字。",
        choices: [
          { label: "收下水", next: "water" },
          { label: "问名字是谁", next: "ask-name" },
        ],
      },
      open: {
        id: "open",
        title: "包裹 / 里面",
        text: "包裹里是一张空白的明信片，和一支快没水的笔。背面印着一行小字：写给你第一个想起来的人。",
        choices: [
          { label: "写一个名字", next: "write" },
          { label: "重新封好", next: "resend" },
        ],
      },
      water: {
        id: "water",
        title: "第 2 站 / 桥",
        text: "你骑到一座断桥。水喝完了，瓶身上的名字被雨冲掉。你把空瓶放在桥头，继续往前。",
        choices: [{ label: "送到终点", next: "end-deliver" }],
      },
      "ask-name": {
        id: "ask-name",
        title: "加油站 / 名字",
        text: "老人说：「是你妈妈的名字。她上个月还来加过油。」你握着瓶子，忽然不记得她最后一次加油是什么时候。",
        choices: [{ label: "掉头", next: "end-turn" }],
      },
      write: {
        id: "write",
        title: "明信片 / 名字",
        text: "你写下一个名字，笔没水了，只留下半个字。你把明信片贴在胸口，继续往终点骑。",
        choices: [{ label: "送到终点", next: "end-deliver" }],
      },
      resend: {
        id: "resend",
        title: "包裹 / 重新封好",
        text: "你把包裹重新绑好。风把它吹得歪了一点，像一个没有寄出去的问题。",
        choices: [{ label: "继续送", next: "end-keep" }],
      },
      "end-deliver": {
        id: "end-deliver",
        title: "结局 / 终点",
        text: "终点是一片很空的海。你把包裹放在岸边，坐了很久。潮水上来的时候，包裹没有漂走。",
        endingLabel: "结局：送到了",
      },
      "end-turn": {
        id: "end-turn",
        title: "结局 / 掉头",
        text: "你掉头往回骑。风很大，后座空了。你不知道包裹是什么时候掉的，也没有回去找。",
        endingLabel: "结局：没送到",
      },
      "end-keep": {
        id: "end-keep",
        title: "结局 / 留下",
        text: "你没有送到终点。你在路边搭了一个棚子，把包裹放在最里面。后来有人路过，问那是什么。你说：一个还没想好送给谁的东西。",
        endingLabel: "结局：留下了",
      },
    },
  },
  "w-g-5": {
    start: "errand-1",
    scenes: {
      "errand-1": {
        id: "errand-1",
        title: "卯时 / 丹炉",
        text: "你把丹炉绑在背上，炉子里的丹忽然说：「我不想去青云宗。他们那里没有火。」仙门给的时限是半个时辰。",
        choices: [
          { label: "快送", next: "fast" },
          { label: "稳送", next: "steady" },
        ],
      },
      fast: {
        id: "fast",
        title: "山路 / 快",
        text: "你抄近路，踩过一片禁地。丹炉越来越烫，丹说：「你踩到别人的坟了。」身后传来铃铛声。",
        choices: [
          { label: "继续跑", next: "run" },
          { label: "停下来道歉", next: "apologize" },
        ],
      },
      steady: {
        id: "steady",
        title: "山路 / 稳",
        text: "你走大路，避开禁地。丹开始给你讲它上一任主人的事。时限快到了，但炉子一直是温的。",
        choices: [
          { label: "听它讲完", next: "listen" },
          { label: "加快脚步", next: "late" },
        ],
      },
      run: {
        id: "run",
        title: "青云宗 / 山门",
        text: "你冲进山门，丹炉裂了一道缝。执事接过丹，闻了闻，说：「火候过了。」",
        choices: [{ label: "讨个说法", next: "end-late" }],
      },
      apologize: {
        id: "apologize",
        title: "禁地 / 铃铛",
        text: "你停下来，对着土坡鞠了一躬。铃铛声停了。丹说：「他们只是想要一句对不起。」",
        choices: [{ label: "继续送", next: "end-late" }],
      },
      listen: {
        id: "listen",
        title: "半路 / 故事",
        text: "丹讲完，天已经黑了。你说：「迟了。」丹说：「没关系。我本来也不想被炼成丹。」",
        choices: [{ label: "放它走", next: "end-free" }],
      },
      late: {
        id: "late",
        title: "青云宗 / 迟到",
        text: "你迟了一刻钟。执事没收丹，只扣了你的灵石。丹在炉子里小声说：「谢谢。」",
        choices: [{ label: "回家打坐", next: "end-home" }],
      },
      "end-late": {
        id: "end-late",
        title: "结局 / 火候",
        text: "青云宗扣了你三块灵石。你蹲在山门口，丹炉还背在身上。丹说：「下次别接这种单。」",
        endingLabel: "结局：白跑一趟",
      },
      "end-free": {
        id: "end-free",
        title: "结局 / 放它走",
        text: "你打开炉子。丹滚进草丛，变成一只很小的火鸟，飞走了。你赔了仙门三块灵石，但今晚的山风很凉快。",
        endingLabel: "结局：散修",
      },
      "end-home": {
        id: "end-home",
        title: "结局 / 回家",
        text: "你回到租来的小屋，把丹炉放在桌上。丹说：「其实你走稳一点，就赶上了。」你说：「我知道。」",
        endingLabel: "结局：下次",
      },
    },
  },
};
