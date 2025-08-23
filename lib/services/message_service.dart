import 'dart:math';

class MessageService {
  static const List<String> motivationalMessages = [
    "You are capable of amazing things",
    "Every small step forward is progress",
    "Your potential is limitless",
    "You have overcome challenges before, you can do it again",
    "Today is a new opportunity to grow",
    "You are stronger than you think",
    "Your efforts matter and make a difference",
    "Believe in yourself, you've got this",
    "You are exactly where you need to be",
    "Your journey is unique and valuable",
  ];

  static const List<String> demotivationalMessages = [
    "I am probably a simulation",
    "I will never succeed",
    "Anything could happen today and that scares me",
    "What if nothing I do matters?",
    "I'm just pretending to know what I'm doing",
    "Everyone else seems to have it figured out",
    "I'm falling behind and can't catch up",
    "What if I'm not as smart as I think I am?",
    "Nothing good ever lasts",
    "I'm just one person in billions",
  ];

  static String getRandomMessage(bool isMotivational) {
    final random = Random();
    final messages = isMotivational ? motivationalMessages : demotivationalMessages;
    return messages[random.nextInt(messages.length)];
  }
}