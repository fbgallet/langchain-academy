import { Client } from "@langchain/langgraph-sdk";

const STUDIO_URL = "http://localhost:63732";
const client = new Client({
  apiUrl: STUDIO_URL,
});
// Using the graph deployed with the name "agent_graph"
const assistantId = "agent_graph";

// Search all hosted graphs
async function myClient() {
  //   console.log(client);
  const thread = await client.threads.create();
  // assistants = await client.assistants.search()

  const input = {
    messages: [{ role: "user", content: "Combient font 5*5 + 3 ?" }],
  };

  const streamResponse = client.runs.stream(thread["thread_id"], assistantId, {
    input: input,
    streamMode: "updates",
  });
  for await (const chunk of streamResponse) {
    //console.log(`Receiving new event of type: ${chunk.event}...`);
    // console.log(chunk.data);
    if (chunk.data.tools) {
      chunk.data.tools.messages.forEach((msg: any) =>
        console.log(`from ${msg.name}: ${msg.content}`)
      );
    } else {
      chunk.data.assistant?.messages.length &&
        chunk.data.assistant.messages.forEach(
          (msg: any) =>
            msg.content && console.log("from assitant:>> ", msg.content)
        );
    }
    // console.log(chunk.data.tools?.messages || chunk.data.assitant?.messages);
  }
}

myClient();
