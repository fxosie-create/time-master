export const MEASURING_MESSAGES = [
  "呼吸を整えて、感覚に集中",
  "自分の体内時計を信じて",
  "時計を忘れて、今に集中",
  "心の中で時間を刻んでみよう",
  "焦らず、あなたのタイミングで",
  "静かに流れる時間を感じよう",
  "ぴったりだと思ったら終了",
  "自分の感覚だけを頼りに",
  "一秒ずつ心で数えてみよう",
  "今この瞬間に集中しよう",
] as const;

export type MeasuringMessage = (typeof MEASURING_MESSAGES)[number];

export function selectMeasuringMessage(random: () => number = Math.random): MeasuringMessage {
  const index = Math.min(
    MEASURING_MESSAGES.length - 1,
    Math.max(0, Math.floor(random() * MEASURING_MESSAGES.length)),
  );
  return MEASURING_MESSAGES[index];
}

export function getMeasuringMessageLines(message: MeasuringMessage | string): readonly string[] {
  if (message === "ぴったりだと思ったら終了") {
    return ["ぴったりだと思ったら", "終了"];
  }
  return [message];
}
