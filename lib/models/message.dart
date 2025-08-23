class Message {
  final int? id;
  final String content;
  final bool isMotivational;

  Message({
    this.id,
    required this.content,
    required this.isMotivational,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'content': content,
      'isMotivational': isMotivational ? 1 : 0,
    };
  }

  factory Message.fromMap(Map<String, dynamic> map) {
    return Message(
      id: map['id'],
      content: map['content'],
      isMotivational: map['isMotivational'] == 1,
    );
  }
}