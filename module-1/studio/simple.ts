import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

interface State {
  graph_state: string;
}
export const StateAnnotation = Annotation.Root({
  graph_state: Annotation<string>,
});

// Type for node names
type NodeName = "node_2" | "node_3";
// Conditional edge function
function decideMood(state: any): NodeName {
  // Often, we will use state to decide on the next node to visit
  const userInput = state.graph_state;
  // Here, let's just do a 50 / 50 split between nodes 2, 3
  if (Math.random() < 0.5) {
    // 50% of the time, we return Node 2
    return "node_2";
  }
  // 50% of the time, we return Node 3
  return "node_3";
}
// Node functions
function node1(state: State): State {
  console.log("---Node 1---");
  return { graph_state: state.graph_state + " I am" };
}
function node2(state: State): State {
  console.log("---Node 2---");
  return { graph_state: state.graph_state + " happy!" };
}
function node3(state: State): State {
  console.log("---Node 3---");
  return { graph_state: state.graph_state + " sad!" };
}

// Build graph
export const builder = new StateGraph(StateAnnotation);
builder
  .addNode("node_1", node1)
  .addNode("node_2", node2)
  .addNode("node_3", node3)
  .addEdge(START, "node_1")
  .addConditionalEdges("node_1", decideMood)
  .addEdge("node_2", END)
  .addEdge("node_3", END);
// Compile graph
export const graph = builder.compile();

(async () => {
  const agentNextState = await graph.invoke({
    graph_state: "Hi, this is Lance.",
  });

  console.log(agentNextState);
})();
