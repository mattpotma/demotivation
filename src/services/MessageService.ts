const MOTIVATIONAL_MESSAGES = [
  "You are capable of amazing things!",
  "Every day is a new opportunity to grow.",
  "Believe in yourself and your abilities.",
  "You have the strength to overcome any challenge.",
  "Your potential is limitless.",
  "Today is your day to shine!",
  "You are making progress, even if you can't see it.",
  "Your hard work will pay off.",
];

const DEMOTIVATIONAL_MESSAGES = [
  "You're probably not as special as you think you are.",
  "Most people won't remember what you did today.",
  "Your problems aren't that unique.",
  "You'll probably give up on this goal like the others.",
  "Nobody cares as much as you think they do.",
  "You're overthinking this.",
  "This too shall pass... into obscurity.",
  "You're just average, and that's okay.",
];

export class MessageService {
  static getRandomMessage(isMotivational: boolean): string {
    const messages = isMotivational ? MOTIVATIONAL_MESSAGES : DEMOTIVATIONAL_MESSAGES;
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }
}