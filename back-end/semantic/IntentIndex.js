// IntentIndex.js
// Stores known intents and their example phrases.
// Later we will attach embeddings to each phrase.

class IntentIndex {

  constructor() {

    this.intents = [

      {
        id: "find_baggage_claim",
        examples: [
          "where is baggage claim",
          "where do bags come out",
          "where get bags",
          "bag place where",
          "my luggage where"
        ]
      },

      {
        id: "find_bathroom",
        examples: [
          "where is bathroom",
          "need toilet",
          "restroom where",
          "place to pee",
          "washroom where"
        ]
      },

      {
        id: "find_exit",
        examples: [
          "where is exit",
          "how leave airport",
          "way out where",
          "exit please"
        ]
      },

      {
        id: "find_charging",
        examples: [
          "charging station where",
          "place charge phone",
          "plug phone where",
          "power outlet where"
        ]
      }

    ];

  }

  getAllIntents() {
    return this.intents;
  }

}

module.exports = new IntentIndex();
