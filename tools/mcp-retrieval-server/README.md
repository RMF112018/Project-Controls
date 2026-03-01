# HBC MCP Retrieval Server

## Setup (once)
cd tools/mcp-retrieval-server
pip install -e .

## Run
hbc-mcp
# or
uvicorn server:app --port 8001 --reload

## Usage in Claude Code
In every prompt (after Hot-memory Constitution):
"Before proposing changes, call the MCP server with find_relevant_context('your query here') and include the returned specs verbatim."

Endpoint: http://localhost:8001/find_relevant_context