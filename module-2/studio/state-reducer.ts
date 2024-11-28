import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

type Mood = "happy" | "sad";

export const StateAnnotation = Annotation.Root({
  foo: Annotation<number[]>({
    reducer: (state: number[], update: number[]) => state.concat(update),
    default: () => [],
  }),
  otherKey: Annotation<string>,
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
})();
