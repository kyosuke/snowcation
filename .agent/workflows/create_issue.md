---
description: Create a GitHub issue from a proposal or plan
---

1. Analyze the provided proposal or plan.
2. If there are any ambiguous points or missing information, ask the user for clarification.
3. Formulate the issue content based on the proposal/plan:
    - **Title**: A clear and concise title in Japanese describing the feature or fix.
    - **Body**:
        - **概要 (Summary)**: A summary of the proposal/plan.
        - **ゴール (Goal)**: The objective of the issue.
        - **タスク (Implementation Plan)**: A checklist of tasks to be completed.
5. Construct the `gh issue create` command.
    - Use the `--title` flag for the title.
    - Use the `--body` flag for the body.
    - Use the `--label "ai-generated"` flag.
    - Ensure the body is properly formatted (e.g., using newlines).
6. Run the `gh issue create` command and notify the user of the created Issue URL.
