import {
  messagesStateReducer,
  MessagesAnnotation,
  Annotation,
  StateGraph,
  START,
  END,
} from "@langchain/langgraph";
import {
  BaseMessage,
  AIMessage,
  HumanMessage,
  RemoveMessage,
} from "@langchain/core/messages";

const reduceArray = <T>(left: T[] | undefined, right: T[] | undefined) => {
  if (!left) left = [];
  if (!right) right = [];
  return left.concat(right);
};

export const StateAnnotation = Annotation.Root({
  foo: Annotation<number[]>({
    // Basic inline reducer
    //  reducer: (state: number[], update: number[]) => state.concat(update),

    // Custom reducer
    reducer: (state: number[], update: number[]) => reduceArray(state, update),
    default: () => [],
  }),
});
export type State = typeof StateAnnotation.State;

// Node functions
function node1(state: State) {
  console.log("---Node 1---");
  return { foo: [state.foo[0] + 1] };
}
function node2(state: State) {
  console.log("---Node 2---");
  return { foo: [state.foo[0] + 1] };
}
function node3(state: State) {
  console.log("---Node 3---");
  return { foo: [state.foo[0] + 1] };
}

// Build graph
export const builder = new StateGraph(StateAnnotation);
builder
  .addNode("node_1", node1)
  .addNode("node_2", node2)
  .addNode("node_3", node3)
  .addEdge(START, "node_1")
  .addEdge("node_1", "node_2")
  .addEdge("node_1", "node_3")
  .addEdge("node_2", END)
  .addEdge("node_3", END);
// Compile graph
export const graph = builder.compile();

(async () => {
  const agentNextState = await graph.invoke({
    foo: [1],
  });
  console.log(agentNextState);

  // Messages States
  const CustuomMessagesState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
      reducer: messagesStateReducer,
    }),
    addedKey1: Annotation<string>,
    addedKey2: Annotation<string>,
  });

  const ExtendedMessagesState = Annotation.Root({
    ...MessagesAnnotation.spec,
    addedKey1: Annotation<string>,
    addedKey2: Annotation<string>,
  });

  const initial_messages = [
    new AIMessage({ content: "Hello! How can I assist you?" }),
    new HumanMessage({
      content: "I'm looking for information on marine biology.",
      name: "Lance",
    }),
  ];

  // New message to add
  const new_message = new AIMessage({
    content:
      "Sure, I can help with that. What specifically are you interested in?",
  });
  let messages = messagesStateReducer(initial_messages, new_message);
  // Test
  console.log("Concatened messages :>>", messages);
  const delete_messages = messages
    .slice(-2)
    .map((m) => new RemoveMessage({ id: m.id || "" }));
  console.log(
    "Messages after last 2 deleted :>>",
    messagesStateReducer(messages, delete_messages)
  );
})();
