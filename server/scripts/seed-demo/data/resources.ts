import { ResourceType } from '../../../src/modules/resource/enums/resource-types.enum';

/**
 * Demo study material. Every entry is rendered to a real PDF, uploaded to
 * Cloudinary and ingested through the normal RAG pipeline, so the content
 * has to be accurate — the AI assistant answers from it during the demo.
 */
export interface SeedSection {
  heading: string;
  paragraphs: string[];
}

export interface SeedResource {
  key: string;
  title: string;
  description: string;
  subject: string;
  course: string;
  semester: number;
  resourceType: ResourceType;
  tags: string[];
  /** Key of the uploader in users.ts. */
  uploader: string;
  /** 'approved' goes through ResourceService.approve (ingestion + reputation). */
  status: 'approved' | 'pending' | 'rejected';
  rejectionReason?: string;
  sections: SeedSection[];
}

export const RESOURCES: SeedResource[] = [
  {
    key: 'ds-linear',
    title: 'Linked Lists, Stacks and Queues',
    description:
      'Lecture notes covering singly/doubly linked lists, stack and queue ADTs, their array vs. linked implementations and complexity.',
    subject: 'Data Structures',
    course: 'CS-201',
    semester: 3,
    resourceType: ResourceType.NOTES,
    tags: ['linked list', 'stack', 'queue', 'ADT'],
    uploader: 'ayesha',
    status: 'approved',
    sections: [
      {
        heading: '1. Linked lists',
        paragraphs: [
          'A linked list stores a sequence as nodes, where each node holds a value and a pointer to the next node. Unlike an array, the nodes are not contiguous in memory, so the list can grow one node at a time without reallocating.',
          'In a singly linked list each node points only to its successor; the list is accessed through a head pointer and the last node points to null. Inserting or deleting at the head is O(1). Accessing the k-th element is O(k) because you must walk from the head — there is no random access.',
          'A doubly linked list adds a prev pointer to each node. This costs one extra pointer per node but allows O(1) deletion of a node when you already hold a pointer to it, and traversal in both directions. Keeping a tail pointer makes insertion at the end O(1) as well.',
          'Common pitfalls: forgetting to update head when deleting the first node, losing the rest of the list by overwriting next before saving it, and not handling the empty list. Drawing the pointers before coding avoids most of these bugs.',
        ],
      },
      {
        heading: '2. Stacks (LIFO)',
        paragraphs: [
          'A stack is an abstract data type with push, pop and peek, all O(1). The last element pushed is the first popped (last-in, first-out).',
          'Array implementation: keep an index top; push writes at top and increments it. A dynamic array doubles its capacity when full, which gives O(1) amortized push. Linked implementation: push and pop at the head of a singly linked list.',
          'Applications: function call stacks, undo operations, checking balanced parentheses, evaluating postfix expressions and converting infix to postfix (shunting-yard), and depth-first search.',
        ],
      },
      {
        heading: '3. Queues (FIFO)',
        paragraphs: [
          'A queue supports enqueue at the rear and dequeue at the front, first-in, first-out. A naive array queue wastes space as the front moves forward, so a circular array is used: front and rear indices wrap around using modulo capacity.',
          'In a circular queue of capacity n, the queue is full when (rear + 1) mod n == front if one slot is kept empty to distinguish full from empty. A linked queue keeps head and tail pointers and dequeues from the head.',
          'Variants: a deque allows insertion and deletion at both ends; a priority queue dequeues the highest-priority element first and is usually implemented with a binary heap, not a list. Queues are used in BFS, CPU scheduling and buffering.',
        ],
      },
    ],
  },
  {
    key: 'ds-trees',
    title: 'Trees, Binary Search Trees and Heaps',
    description:
      'Tree terminology, traversals, BST insert/delete and the binary heap with heapify and heap sort.',
    subject: 'Data Structures',
    course: 'CS-201',
    semester: 3,
    resourceType: ResourceType.NOTES,
    tags: ['BST', 'heap', 'traversal', 'trees'],
    uploader: 'ayesha',
    status: 'approved',
    sections: [
      {
        heading: 'Terminology and traversals',
        paragraphs: [
          'A tree is a connected acyclic graph with a designated root. The depth of a node is the number of edges from the root; the height of the tree is the maximum depth. A binary tree gives each node at most two children.',
          'Depth-first traversals of a binary tree: preorder (node, left, right), inorder (left, node, right) and postorder (left, right, node). Level-order traversal visits nodes breadth-first using a queue. An inorder traversal of a BST visits keys in sorted order.',
        ],
      },
      {
        heading: 'Binary search trees',
        paragraphs: [
          'A BST keeps every key in the left subtree smaller than the node and every key in the right subtree larger. Search, insert and delete all follow one root-to-leaf path, so they cost O(h) where h is the height.',
          'Deleting a node has three cases: a leaf is simply removed; a node with one child is replaced by that child; a node with two children is replaced by its inorder successor (the minimum of the right subtree), which is then deleted from the right subtree.',
          'If keys are inserted in sorted order the BST degenerates into a linked list with h = n. Self-balancing trees such as AVL and red-black trees keep h = O(log n) by rotating after inserts and deletes.',
        ],
      },
      {
        heading: 'Binary heaps',
        paragraphs: [
          'A binary max-heap is a complete binary tree where each parent is at least as large as its children. Because it is complete it is stored in an array: for index i, the children are 2i+1 and 2i+2 and the parent is floor((i-1)/2).',
          'Insert appends at the end and sifts up: O(log n). Extract-max swaps the root with the last element, removes it and sifts the new root down: O(log n). Building a heap from n elements by sifting down from the last internal node is O(n), not O(n log n).',
          'Heap sort builds a max-heap and repeatedly extracts the maximum into the end of the array. It runs in O(n log n) worst case, sorts in place, and is not stable.',
        ],
      },
    ],
  },
  {
    key: 'algo-asymptotic',
    title: 'Asymptotic Analysis and Recurrences',
    description:
      'Big-O, Omega and Theta, solving recurrences with the recursion tree and the Master Theorem.',
    subject: 'Design and Analysis of Algorithms',
    course: 'CS-202',
    semester: 4,
    resourceType: ResourceType.NOTES,
    tags: ['big-o', 'master theorem', 'recurrences', 'complexity'],
    uploader: 'ayesha',
    status: 'approved',
    sections: [
      {
        heading: 'Asymptotic notation',
        paragraphs: [
          'f(n) = O(g(n)) means there exist constants c > 0 and n0 such that f(n) <= c·g(n) for all n >= n0: g is an upper bound up to a constant factor. Omega is the matching lower bound, and Theta means both hold, so f and g grow at the same rate.',
          'Rules of thumb: drop constant factors and lower-order terms; log bases differ only by a constant, so O(log2 n) = O(log n). Typical growth order: 1 < log n < sqrt(n) < n < n log n < n^2 < 2^n < n!.',
          'Worst-case, average-case and best-case are about which input you analyse; O/Omega/Theta are about bounding a function. "Quicksort is O(n^2)" is a true statement about its worst case, while its expected running time is Theta(n log n).',
        ],
      },
      {
        heading: 'Recurrences and the Master Theorem',
        paragraphs: [
          'Divide-and-conquer algorithms give recurrences of the form T(n) = a·T(n/b) + f(n): a subproblems of size n/b plus f(n) work to divide and combine. Merge sort is T(n) = 2T(n/2) + Theta(n).',
          'Compare f(n) with n^(log_b a). Case 1: if f(n) = O(n^(log_b a − ε)) the leaves dominate and T(n) = Theta(n^(log_b a)). Case 2: if f(n) = Theta(n^(log_b a)) every level costs the same and T(n) = Theta(n^(log_b a) · log n). Case 3: if f(n) = Omega(n^(log_b a + ε)) and the regularity condition holds, the root dominates and T(n) = Theta(f(n)).',
          'Examples: merge sort has a = 2, b = 2, n^(log_2 2) = n = f(n), so case 2 gives Theta(n log n). Binary search is T(n) = T(n/2) + 1, case 2 again, giving Theta(log n). Strassen multiplication, T(n) = 7T(n/2) + Theta(n^2), falls in case 1: Theta(n^(log_2 7)) ≈ Theta(n^2.81).',
          'When the theorem does not apply (for example T(n) = T(n − 1) + n), expand the recursion or draw a recursion tree: that one sums to n + (n − 1) + … + 1 = Theta(n^2).',
        ],
      },
    ],
  },
  {
    key: 'algo-dp',
    title: 'Dynamic Programming Patterns',
    description:
      'When DP applies, memoization vs. tabulation, and worked examples: Fibonacci, 0/1 knapsack, LCS and edit distance.',
    subject: 'Design and Analysis of Algorithms',
    course: 'CS-202',
    semester: 4,
    resourceType: ResourceType.NOTES,
    tags: ['dynamic programming', 'knapsack', 'LCS', 'memoization'],
    uploader: 'ayesha',
    status: 'approved',
    sections: [
      {
        heading: 'When does DP apply?',
        paragraphs: [
          'Dynamic programming solves problems with two properties. Optimal substructure: an optimal solution is built from optimal solutions of subproblems. Overlapping subproblems: a naive recursion solves the same subproblem many times.',
          'Recipe: (1) define the state — what a subproblem is, e.g. dp[i][w]; (2) write the recurrence in terms of smaller states; (3) fix base cases; (4) choose an evaluation order so dependencies are computed first; (5) read the answer from the right state.',
          'Memoization is top-down: write the recursion and cache results. Tabulation is bottom-up: fill a table in dependency order. Both have the same asymptotic cost — number of states times work per state — but tabulation avoids recursion depth limits and often allows space optimization.',
        ],
      },
      {
        heading: '0/1 knapsack',
        paragraphs: [
          'Given n items with weight w_i and value v_i and capacity W, choose a subset of maximum value with total weight at most W. State dp[i][c] = best value using the first i items with capacity c.',
          'Recurrence: dp[i][c] = dp[i−1][c] if w_i > c, otherwise max(dp[i−1][c], dp[i−1][c − w_i] + v_i). Base case dp[0][c] = 0. Time and space O(nW); space drops to O(W) by iterating c from W down to w_i in a single array. This is pseudo-polynomial because W is a number, not an input size.',
        ],
      },
      {
        heading: 'Longest common subsequence and edit distance',
        paragraphs: [
          'LCS of strings X (length m) and Y (length n): dp[i][j] is the LCS length of X[1..i] and Y[1..j]. If X[i] == Y[j], dp[i][j] = dp[i−1][j−1] + 1; otherwise dp[i][j] = max(dp[i−1][j], dp[i][j−1]). O(mn) time; the subsequence itself is recovered by walking back from dp[m][n].',
          'Edit distance (Levenshtein) counts the minimum insertions, deletions and substitutions to turn X into Y. dp[i][0] = i and dp[0][j] = j. Then dp[i][j] = dp[i−1][j−1] if the characters match, otherwise 1 + min(dp[i−1][j], dp[i][j−1], dp[i−1][j−1]).',
          'Exam tip: always state what dp[i][j] means in words before writing the recurrence — most marks are lost on an ambiguous state definition.',
        ],
      },
    ],
  },
  {
    key: 'algo-graphs',
    title: 'Graph Algorithms: BFS, DFS, Dijkstra and MST',
    description:
      'Slides summary: graph representations, BFS/DFS, shortest paths with Dijkstra and Bellman-Ford, Prim and Kruskal.',
    subject: 'Design and Analysis of Algorithms',
    course: 'CS-202',
    semester: 4,
    resourceType: ResourceType.SLIDES,
    tags: ['graphs', 'dijkstra', 'BFS', 'MST', 'kruskal'],
    uploader: 'hamza',
    status: 'approved',
    sections: [
      {
        heading: 'Representations and traversal',
        paragraphs: [
          'An adjacency list uses O(V + E) space and is best for sparse graphs; an adjacency matrix uses O(V^2) space but answers "is (u, v) an edge?" in O(1).',
          'Breadth-first search explores in layers using a queue and finds shortest paths by number of edges in an unweighted graph, in O(V + E). Depth-first search goes deep using recursion or a stack, also O(V + E); it is the basis of topological sort, cycle detection and finding strongly connected components.',
        ],
      },
      {
        heading: 'Shortest paths',
        paragraphs: [
          "Dijkstra's algorithm finds single-source shortest paths when all edge weights are non-negative. It repeatedly extracts the unvisited vertex with the smallest tentative distance and relaxes its outgoing edges. With a binary heap it runs in O((V + E) log V).",
          'Dijkstra fails with negative edges because a finalized vertex could later be reached more cheaply. Bellman-Ford relaxes every edge V − 1 times in O(VE) and handles negative weights; one more pass that still improves a distance proves a negative cycle is reachable.',
        ],
      },
      {
        heading: 'Minimum spanning trees',
        paragraphs: [
          'A minimum spanning tree connects all vertices of a weighted undirected graph with minimum total weight. Both classic algorithms rely on the cut property: the lightest edge crossing any cut belongs to some MST.',
          'Kruskal sorts edges by weight and adds each edge that does not form a cycle, using a union-find structure: O(E log E). Prim grows one tree from a start vertex, always adding the lightest edge leaving the tree, using a priority queue: O(E log V).',
        ],
      },
    ],
  },
  {
    key: 'os-scheduling',
    title: 'CPU Scheduling Algorithms',
    description:
      'FCFS, SJF, SRTF, priority and round robin scheduling with Gantt chart examples and how to compute waiting/turnaround time.',
    subject: 'Operating Systems',
    course: 'CS-311',
    semester: 5,
    resourceType: ResourceType.NOTES,
    tags: ['scheduling', 'round robin', 'SJF', 'process'],
    uploader: 'hamza',
    status: 'approved',
    sections: [
      {
        heading: 'Metrics',
        paragraphs: [
          'Turnaround time = completion time − arrival time. Waiting time = turnaround time − burst time. Response time = time of first run − arrival time. Schedulers trade these off against throughput and CPU utilization.',
          'Preemptive schedulers can take the CPU away from a running process (on a timer interrupt or when a higher-priority process arrives); non-preemptive ones run a process until it blocks or finishes.',
        ],
      },
      {
        heading: 'Algorithms',
        paragraphs: [
          'First-Come, First-Served (FCFS) runs processes in arrival order. It is simple but suffers from the convoy effect: short jobs wait behind one long CPU-bound job.',
          'Shortest Job First (SJF) picks the process with the smallest next CPU burst and is provably optimal for average waiting time among non-preemptive schedulers. Its preemptive version, Shortest Remaining Time First (SRTF), preempts when a new process has a shorter remaining time. Both need burst estimates, usually an exponential average: τ(n+1) = α·t(n) + (1 − α)·τ(n).',
          'Priority scheduling runs the highest-priority process; low-priority processes can starve, which aging fixes by gradually raising the priority of waiting processes.',
          'Round Robin gives each process a time quantum q in a circular ready queue. With a very large q it becomes FCFS; with a very small q context-switch overhead dominates. A common rule is that about 80% of CPU bursts should be shorter than q.',
        ],
      },
      {
        heading: 'Worked example (Round Robin, q = 4)',
        paragraphs: [
          'Processes P1 (burst 10), P2 (burst 4), P3 (burst 6), all arriving at time 0. Gantt chart: P1 0–4, P2 4–8, P3 8–12, P1 12–16, P3 16–18, P1 18–20.',
          'Completion times: P2 = 8, P3 = 18, P1 = 20. Waiting times: P1 = 20 − 10 = 10, P2 = 8 − 4 = 4, P3 = 18 − 6 = 12. Average waiting time = 26 / 3 ≈ 8.67.',
        ],
      },
    ],
  },
  {
    key: 'os-deadlock',
    title: "Deadlocks and the Banker's Algorithm",
    description:
      "Coffman conditions, resource allocation graphs, prevention vs. avoidance, and a worked Banker's algorithm safety check.",
    subject: 'Operating Systems',
    course: 'CS-311',
    semester: 5,
    resourceType: ResourceType.NOTES,
    tags: ['deadlock', 'bankers algorithm', 'synchronization'],
    uploader: 'hamza',
    status: 'approved',
    sections: [
      {
        heading: 'Necessary conditions',
        paragraphs: [
          'A deadlock is a set of processes each waiting for a resource held by another process in the set. Four conditions (Coffman) must hold simultaneously: mutual exclusion, hold and wait, no preemption, and circular wait.',
          'In a resource allocation graph, a cycle is necessary for deadlock. If every resource type has a single instance, a cycle is also sufficient; with multiple instances a cycle may exist without deadlock.',
        ],
      },
      {
        heading: 'Handling deadlocks',
        paragraphs: [
          'Prevention breaks one of the four conditions: e.g. request all resources at once (breaks hold and wait) or impose a global ordering on resource types and always acquire in that order (breaks circular wait).',
          'Avoidance lets the OS grant a request only if the resulting state is safe — there exists some order in which every process can finish. Detection and recovery lets deadlocks happen, detects cycles periodically, then kills or rolls back victims. Many general-purpose OSes simply ignore deadlocks (the ostrich approach).',
        ],
      },
      {
        heading: "Banker's algorithm",
        paragraphs: [
          'Data: Available[m], Max[n][m], Allocation[n][m], and Need = Max − Allocation. Safety check: set Work = Available and Finish[i] = false. Find a process i with Finish[i] false and Need[i] <= Work; set Work = Work + Allocation[i] and Finish[i] = true; repeat. If all processes finish, the state is safe and that order is a safe sequence.',
          'Example with one resource type, Available = 3: P0 has Allocation 5, Max 10 (Need 5); P1 has Allocation 2, Max 4 (Need 2); P2 has Allocation 2, Max 9 (Need 7). P1 can finish (Need 2 <= 3), Work becomes 5; then P0 (Need 5 <= 5), Work becomes 10; then P2 (Need 7 <= 10). Safe sequence: P1, P0, P2.',
          'To handle a request, pretend to grant it and run the safety check; if the new state is unsafe, the process waits.',
        ],
      },
    ],
  },
  {
    key: 'os-paper',
    title: 'Operating Systems Final Exam 2025 — Solved',
    description:
      'Past paper with worked solutions: scheduling, paging and page replacement, semaphores.',
    subject: 'Operating Systems',
    course: 'CS-311',
    semester: 5,
    resourceType: ResourceType.PAST_PAPER,
    tags: ['past paper', 'paging', 'semaphores', 'final exam'],
    uploader: 'hamza',
    status: 'approved',
    sections: [
      {
        heading: 'Q1. Paging (10 marks)',
        paragraphs: [
          'A system uses 32-bit logical addresses and 4 KB pages. (a) How many bits are the page offset? (b) How many entries does a single-level page table need?',
          'Solution: 4 KB = 2^12 bytes, so the offset is 12 bits. The page number has 32 − 12 = 20 bits, so the table has 2^20 ≈ 1 million entries. At 4 bytes per entry that is 4 MB per process, which is why multi-level page tables or inverted page tables are used.',
        ],
      },
      {
        heading: 'Q2. Page replacement (10 marks)',
        paragraphs: [
          'Reference string 7, 0, 1, 2, 0, 3, 0, 4, 2, 3 with 3 frames. Count page faults for FIFO and LRU.',
          'FIFO: faults on 7, 0, 1, 2 (evicts 7), 3 (evicts 0), 0 (evicts 1), 4 (evicts 2), 2 (evicts 3), 3 (evicts 0) — 9 faults. LRU: faults on 7, 0, 1, 2 (evicts 7), 3 (evicts 1), 4 (evicts 2), 2 (evicts 3), 3 (evicts 0) — 8 faults; the second reference to 0 is a hit under both.',
          "Note: FIFO can suffer Belady's anomaly (more frames causing more faults); stack algorithms such as LRU and OPT cannot.",
        ],
      },
      {
        heading: 'Q3. Semaphores (10 marks)',
        paragraphs: [
          'Solve the bounded-buffer producer–consumer problem with semaphores.',
          'Solution: mutex = 1, empty = N, full = 0. Producer: wait(empty); wait(mutex); add item; signal(mutex); signal(full). Consumer: wait(full); wait(mutex); remove item; signal(mutex); signal(empty). Swapping the order of wait(empty) and wait(mutex) in the producer can deadlock when the buffer is full.',
        ],
      },
    ],
  },
  {
    key: 'db-normalization',
    title: 'Normalization: 1NF to BCNF',
    description:
      'Functional dependencies, anomalies, and step-by-step decomposition into 1NF, 2NF, 3NF and BCNF with an example.',
    subject: 'Database Systems',
    course: 'CS-321',
    semester: 4,
    resourceType: ResourceType.NOTES,
    tags: ['normalization', 'BCNF', '3NF', 'functional dependency'],
    uploader: 'bilal',
    status: 'approved',
    sections: [
      {
        heading: 'Why normalize?',
        paragraphs: [
          'Redundant data causes anomalies. Update anomaly: the same fact stored in many rows must be changed everywhere. Insertion anomaly: you cannot record a fact without an unrelated one (a new course with no enrolled students). Deletion anomaly: deleting a row loses an unrelated fact.',
          'A functional dependency X → Y means that rows agreeing on X must agree on Y. A candidate key is a minimal set of attributes that determines all others. Normal forms are defined in terms of which dependencies are allowed.',
        ],
      },
      {
        heading: 'The normal forms',
        paragraphs: [
          '1NF: every attribute holds a single atomic value — no repeating groups or lists in a cell.',
          '2NF: 1NF and no partial dependency — no non-key attribute depends on only part of a composite candidate key.',
          '3NF: 2NF and no transitive dependency — for every non-trivial X → A, either X is a superkey or A is part of some candidate key.',
          'BCNF: for every non-trivial X → A, X is a superkey. BCNF is stricter than 3NF; a BCNF decomposition is always lossless but may not preserve all dependencies, while 3NF can always be reached with both properties.',
        ],
      },
      {
        heading: 'Worked example',
        paragraphs: [
          'Enrollment(StudentID, CourseID, StudentName, CourseTitle, Instructor, Grade) with key (StudentID, CourseID) and FDs StudentID → StudentName, CourseID → CourseTitle, CourseID → Instructor, (StudentID, CourseID) → Grade.',
          'StudentName and CourseTitle depend on part of the key, so the relation is not in 2NF. Decompose into Student(StudentID, StudentName), Course(CourseID, CourseTitle, Instructor) and Enrollment(StudentID, CourseID, Grade). Each has a single determinant that is its key, so all three are in BCNF, and the join on the shared keys is lossless.',
          'If instead each instructor teaches exactly one course (Instructor → CourseID) while a course can have several instructors, the relation (Student, Course, Instructor) with key (Student, Course) is in 3NF but not BCNF, because Instructor is not a superkey.',
        ],
      },
    ],
  },
  {
    key: 'db-transactions',
    title: 'Transactions, ACID and Concurrency Control',
    description:
      'ACID properties, schedules and serializability, two-phase locking, and isolation levels.',
    subject: 'Database Systems',
    course: 'CS-321',
    semester: 4,
    resourceType: ResourceType.NOTES,
    tags: ['transactions', 'ACID', '2PL', 'isolation levels'],
    uploader: 'bilal',
    status: 'approved',
    sections: [
      {
        heading: 'ACID',
        paragraphs: [
          'Atomicity: a transaction happens entirely or not at all (undo logging rolls back partial work). Consistency: a transaction takes the database from one valid state to another. Isolation: concurrent transactions do not see each other’s intermediate states. Durability: once committed, changes survive crashes (redo logging / write-ahead log).',
        ],
      },
      {
        heading: 'Serializability and locking',
        paragraphs: [
          'A schedule is conflict-serializable if it can be transformed into some serial schedule by swapping adjacent non-conflicting operations. Two operations conflict if they belong to different transactions, touch the same item and at least one is a write. Test: build the precedence graph; the schedule is conflict-serializable exactly when the graph is acyclic.',
          'Two-phase locking (2PL): a transaction acquires all its locks before releasing any (growing phase, then shrinking phase). 2PL guarantees conflict-serializability but can deadlock. Strict 2PL holds exclusive locks until commit, which also prevents cascading aborts.',
        ],
      },
      {
        heading: 'Isolation levels',
        paragraphs: [
          'Read uncommitted allows dirty reads. Read committed prevents dirty reads but allows non-repeatable reads. Repeatable read prevents non-repeatable reads but (in the SQL standard) allows phantoms. Serializable prevents all three.',
          'Many systems implement isolation with MVCC (multi-version concurrency control): readers see a snapshot and never block writers. PostgreSQL’s Repeatable Read is snapshot isolation, which can still allow write skew; its Serializable level adds checks to prevent it.',
        ],
      },
    ],
  },
  {
    key: 'net-models',
    title: 'The OSI and TCP/IP Models',
    description:
      'Seven OSI layers with their responsibilities, PDUs and example protocols, mapped to the four-layer TCP/IP model.',
    subject: 'Computer Networks',
    course: 'CS-341',
    semester: 5,
    resourceType: ResourceType.NOTES,
    tags: ['OSI', 'TCP/IP', 'layers', 'protocols'],
    uploader: 'hamza',
    status: 'approved',
    sections: [
      {
        heading: 'The seven OSI layers',
        paragraphs: [
          '7. Application — network services for applications (HTTP, DNS, SMTP). 6. Presentation — data representation, encoding, encryption and compression (TLS is often placed here). 5. Session — establishing and managing dialogues between applications.',
          '4. Transport — end-to-end delivery between processes, using port numbers. TCP gives reliable, ordered, connection-oriented byte streams with flow and congestion control; UDP is connectionless and best-effort. PDU: segment (TCP) or datagram (UDP).',
          '3. Network — logical addressing and routing across networks (IP, ICMP; routers). PDU: packet. 2. Data link — framing, MAC addressing and error detection on one link (Ethernet, Wi-Fi; switches). PDU: frame. 1. Physical — transmission of raw bits over a medium (cables, radio; hubs). PDU: bit.',
          'Mnemonic from layer 1 up: "Please Do Not Throw Sausage Pizza Away."',
        ],
      },
      {
        heading: 'TCP/IP model and encapsulation',
        paragraphs: [
          'The TCP/IP model has four layers: Link (OSI 1–2), Internet (OSI 3), Transport (OSI 4) and Application (OSI 5–7). The OSI model is a reference for reasoning about networks; TCP/IP is what the Internet actually runs.',
          'On sending, each layer adds its header to the data from the layer above (encapsulation): HTTP data becomes a TCP segment, then an IP packet, then an Ethernet frame. The receiver strips headers in reverse (decapsulation). Each layer talks logically to the same layer on the other host.',
        ],
      },
    ],
  },
  {
    key: 'net-tcp',
    title: 'TCP Reliability and Congestion Control',
    description:
      'Slides summary: three-way handshake, sliding windows, slow start, congestion avoidance, fast retransmit and fast recovery.',
    subject: 'Computer Networks',
    course: 'CS-341',
    semester: 5,
    resourceType: ResourceType.SLIDES,
    tags: ['TCP', 'congestion control', 'slow start', 'handshake'],
    uploader: 'hamza',
    status: 'approved',
    sections: [
      {
        heading: 'Connection management and reliability',
        paragraphs: [
          'TCP opens a connection with a three-way handshake: SYN, SYN-ACK, ACK, which synchronizes initial sequence numbers in both directions. It closes with FIN/ACK in each direction; the side that closes first waits in TIME_WAIT for twice the maximum segment lifetime.',
          'Reliability comes from sequence numbers, cumulative acknowledgements and retransmission on timeout. Flow control uses the receiver’s advertised window (rwnd) so a fast sender cannot overflow a slow receiver.',
        ],
      },
      {
        heading: 'Congestion control',
        paragraphs: [
          'The sender also keeps a congestion window (cwnd); it may have min(cwnd, rwnd) bytes unacknowledged. Slow start begins with a small cwnd and doubles it every round-trip time (exponential growth) until it reaches the slow-start threshold (ssthresh).',
          'Congestion avoidance then grows cwnd by about one MSS per RTT (additive increase). On a timeout, ssthresh = cwnd / 2 and cwnd restarts from 1 MSS. On three duplicate ACKs, TCP Reno does fast retransmit of the missing segment and fast recovery: ssthresh = cwnd / 2 and cwnd = ssthresh, skipping slow start (multiplicative decrease).',
          'This additive-increase / multiplicative-decrease (AIMD) behaviour produces the characteristic sawtooth graph of cwnd over time and lets competing flows converge toward a fair share.',
        ],
      },
    ],
  },
  {
    key: 'se-process',
    title: 'Software Process Models',
    description:
      'Waterfall, incremental, spiral and agile (Scrum) compared, with when to use each.',
    subject: 'Software Engineering',
    course: 'CS-352',
    semester: 6,
    resourceType: ResourceType.NOTES,
    tags: ['SDLC', 'agile', 'scrum', 'waterfall'],
    uploader: 'usman',
    status: 'approved',
    sections: [
      {
        heading: 'Plan-driven models',
        paragraphs: [
          'Waterfall moves through requirements, design, implementation, testing and maintenance in sequence, each phase signed off before the next. It suits projects with stable, well-understood requirements and heavy documentation needs, but feedback arrives late and change is expensive.',
          'The V-model pairs each development phase with a testing phase (requirements with acceptance testing, design with integration testing). Incremental development delivers the system in usable pieces so users give feedback earlier.',
          "Boehm's spiral model iterates through planning, risk analysis, engineering and evaluation. Its distinguishing feature is explicit risk analysis in every loop, which makes it fit large, high-risk projects.",
        ],
      },
      {
        heading: 'Agile and Scrum',
        paragraphs: [
          'The Agile Manifesto values individuals and interactions, working software, customer collaboration and responding to change over processes, documentation, contract negotiation and following a plan.',
          'Scrum organizes work in fixed-length sprints (usually 1–4 weeks). Roles: Product Owner (owns and orders the product backlog), Scrum Master (coaches the process and removes impediments) and the Developers. Events: sprint planning, daily scrum, sprint review and sprint retrospective. Artifacts: product backlog, sprint backlog and the increment.',
          'Backlog items are often written as user stories — "As a <role>, I want <goal> so that <benefit>" — with acceptance criteria, and estimated in story points. Velocity is the number of points completed per sprint and is used for forecasting, not for comparing teams.',
        ],
      },
    ],
  },
  {
    key: 'ai-search',
    title: 'Informed Search: A* and Heuristics',
    description:
      'Uninformed vs. informed search, greedy best-first, A*, admissible and consistent heuristics.',
    subject: 'Artificial Intelligence',
    course: 'CS-411',
    semester: 7,
    resourceType: ResourceType.NOTES,
    tags: ['A*', 'heuristics', 'search', 'admissible'],
    uploader: 'fatima',
    status: 'approved',
    sections: [
      {
        heading: 'From uninformed to informed search',
        paragraphs: [
          'Uninformed strategies such as BFS, uniform-cost search and iterative deepening use only the problem definition. Informed search uses a heuristic h(n): an estimate of the cost from node n to the nearest goal.',
          'Greedy best-first search expands the node with the smallest h(n). It is often fast but neither complete in general nor optimal, because it ignores the cost already paid to reach n.',
        ],
      },
      {
        heading: 'A* search',
        paragraphs: [
          'A* expands the node with the smallest f(n) = g(n) + h(n), where g(n) is the path cost from the start. It combines the optimality of uniform-cost search with the guidance of a heuristic.',
          'A heuristic is admissible if it never overestimates the true cost: h(n) <= h*(n). With an admissible heuristic, A* tree search is optimal. A heuristic is consistent (monotone) if h(n) <= c(n, n′) + h(n′) for every successor n′; consistency implies admissibility and makes A* graph search optimal without re-opening nodes.',
          'For the 8-puzzle, the number of misplaced tiles (h1) and the sum of Manhattan distances (h2) are both admissible, and h2 dominates h1 (h2 >= h1 everywhere), so A* with h2 expands fewer nodes. On road maps, straight-line distance to the goal is admissible.',
        ],
      },
    ],
  },
  {
    key: 'ml-logreg',
    title: 'Logistic Regression from Scratch',
    description:
      'Sigmoid, cross-entropy loss, gradient descent update and decision boundaries, with a NumPy implementation.',
    subject: 'Machine Learning',
    course: 'CS-443',
    semester: 7,
    resourceType: ResourceType.NOTES,
    tags: [
      'logistic regression',
      'gradient descent',
      'classification',
      'numpy',
    ],
    uploader: 'fatima',
    status: 'approved',
    sections: [
      {
        heading: 'Model',
        paragraphs: [
          'Logistic regression is a linear model for binary classification. It computes z = w·x + b and passes it through the sigmoid σ(z) = 1 / (1 + e^(−z)), which maps any real number to (0, 1) and is read as P(y = 1 | x).',
          'Predict class 1 when σ(z) >= 0.5, i.e. when w·x + b >= 0. The decision boundary w·x + b = 0 is therefore a hyperplane; non-linear boundaries need engineered features such as polynomial terms.',
        ],
      },
      {
        heading: 'Loss and training',
        paragraphs: [
          'Squared error with a sigmoid gives a non-convex loss, so logistic regression uses binary cross-entropy: L = −[y·log(p) + (1 − y)·log(1 − p)], averaged over the m training examples. It is convex in w and b and is the negative log-likelihood of a Bernoulli model.',
          'The gradient has a simple form: ∂L/∂w = (1/m)·Xᵀ(p − y) and ∂L/∂b = (1/m)·Σ(p − y). Gradient descent repeats w := w − α·∂L/∂w and b := b − α·∂L/∂b with learning rate α.',
          'NumPy sketch: p = 1 / (1 + np.exp(-(X @ w + b))); grad_w = X.T @ (p - y) / m; grad_b = np.mean(p - y); w -= lr * grad_w; b -= lr * grad_b. Standardize features first so a single learning rate works for all of them.',
          'For more than two classes use softmax regression (multinomial) or one-vs-rest, which trains one binary classifier per class.',
        ],
      },
    ],
  },
  {
    key: 'ml-bias',
    title: 'Bias, Variance and Regularization',
    description:
      'Underfitting vs. overfitting, the bias–variance trade-off, L1/L2 regularization and cross-validation.',
    subject: 'Machine Learning',
    course: 'CS-443',
    semester: 7,
    resourceType: ResourceType.NOTES,
    tags: [
      'overfitting',
      'regularization',
      'cross-validation',
      'bias-variance',
    ],
    uploader: 'fatima',
    status: 'approved',
    sections: [
      {
        heading: 'Bias and variance',
        paragraphs: [
          'Expected test error decomposes into bias² + variance + irreducible noise. Bias is error from wrong assumptions — a model too simple to capture the pattern (underfitting): high training error and high test error.',
          'Variance is sensitivity to the particular training set — a model so flexible it fits noise (overfitting): low training error but much higher test error. Increasing model complexity lowers bias and raises variance; the goal is the sweet spot in between.',
          'Diagnosis with learning curves: if training and validation errors are both high and close, add features or capacity. If there is a large gap between them, get more data, simplify the model or regularize.',
        ],
      },
      {
        heading: 'Regularization and validation',
        paragraphs: [
          'L2 regularization (ridge) adds λ·Σw² to the loss and shrinks weights smoothly toward zero. L1 regularization (lasso) adds λ·Σ|w| and drives some weights exactly to zero, performing feature selection. Larger λ means more bias and less variance. The bias term is usually not regularized.',
          'Other regularizers: early stopping, dropout in neural networks, and data augmentation.',
          'Choose λ and other hyperparameters on a validation set, never the test set. k-fold cross-validation splits the data into k folds, trains on k − 1 and validates on the remaining one, rotating k times and averaging — a more reliable estimate when data is limited.',
        ],
      },
    ],
  },
  {
    key: 'math-eigen',
    title: 'Eigenvalues and Eigenvectors — Worked Examples',
    description:
      'Characteristic polynomial, finding eigenvectors, diagonalization, with fully worked 2×2 examples.',
    subject: 'Linear Algebra',
    course: 'MATH-201',
    semester: 2,
    resourceType: ResourceType.NOTES,
    tags: ['eigenvalues', 'diagonalization', 'matrices'],
    uploader: 'hira',
    status: 'approved',
    sections: [
      {
        heading: 'Definitions',
        paragraphs: [
          'A non-zero vector v is an eigenvector of a square matrix A with eigenvalue λ if Av = λv: multiplying by A only scales v. Eigenvalues are the roots of the characteristic polynomial det(A − λI) = 0.',
          'Useful checks: the sum of the eigenvalues equals the trace of A, and their product equals det(A). A triangular matrix has its diagonal entries as eigenvalues. A real symmetric matrix has real eigenvalues and orthogonal eigenvectors.',
        ],
      },
      {
        heading: 'Worked example',
        paragraphs: [
          'A = [[4, 1], [2, 3]]. det(A − λI) = (4 − λ)(3 − λ) − 2 = λ² − 7λ + 10 = (λ − 5)(λ − 2), so λ1 = 5 and λ2 = 2. Check: 5 + 2 = 7 = trace, 5·2 = 10 = det.',
          'For λ = 5: (A − 5I)v = [[−1, 1], [2, −2]]v = 0 gives v1 = v2, so v = (1, 1). For λ = 2: (A − 2I)v = [[2, 1], [2, 1]]v = 0 gives 2v1 + v2 = 0, so v = (1, −2).',
        ],
      },
      {
        heading: 'Diagonalization',
        paragraphs: [
          'If A has n linearly independent eigenvectors, A = P D P⁻¹ where the columns of P are the eigenvectors and D is diagonal with the matching eigenvalues. For the example, P = [[1, 1], [1, −2]] and D = diag(5, 2).',
          'Diagonalization makes powers cheap: A^k = P D^k P⁻¹, and D^k just raises each diagonal entry to the k-th power. This is how linear recurrences such as Fibonacci get closed forms, and it underlies PCA and Markov chain steady states.',
          'Distinct eigenvalues guarantee diagonalizability. A repeated eigenvalue may not have enough eigenvectors: [[1, 1], [0, 1]] has λ = 1 twice but only one independent eigenvector, so it is not diagonalizable.',
        ],
      },
    ],
  },
  {
    key: 'math-bayes',
    title: "Conditional Probability and Bayes' Theorem",
    description:
      'Conditional probability, independence, the law of total probability and Bayes’ theorem with the classic medical-test example.',
    subject: 'Probability and Statistics',
    course: 'MATH-301',
    semester: 3,
    resourceType: ResourceType.NOTES,
    tags: ['bayes theorem', 'conditional probability', 'probability'],
    uploader: 'hira',
    status: 'approved',
    sections: [
      {
        heading: 'Conditional probability and independence',
        paragraphs: [
          'P(A | B) = P(A ∩ B) / P(B) for P(B) > 0: the probability of A once we know B happened. Rearranged, this is the multiplication rule P(A ∩ B) = P(A | B)·P(B).',
          'A and B are independent if P(A ∩ B) = P(A)·P(B), equivalently P(A | B) = P(A). Independence is not the same as being mutually exclusive: two mutually exclusive events with positive probability are always dependent.',
        ],
      },
      {
        heading: "Total probability and Bayes' theorem",
        paragraphs: [
          'If B1, …, Bn partition the sample space, P(A) = Σ P(A | Bi)·P(Bi) (law of total probability).',
          "Bayes' theorem reverses the conditioning: P(B | A) = P(A | B)·P(B) / P(A). P(B) is the prior, P(A | B) the likelihood and P(B | A) the posterior.",
        ],
      },
      {
        heading: 'Example: a medical test',
        paragraphs: [
          'A disease affects 1% of people. A test detects it 99% of the time (sensitivity) and has a 5% false-positive rate. You test positive — what is the chance you have the disease?',
          'P(D) = 0.01, P(+ | D) = 0.99, P(+ | not D) = 0.05. P(+) = 0.99·0.01 + 0.05·0.99 = 0.0099 + 0.0495 = 0.0594. P(D | +) = 0.0099 / 0.0594 ≈ 0.167.',
          'Only about 17% — because the disease is rare, most positives come from the large healthy group. Ignoring the prior here is called the base-rate fallacy.',
        ],
      },
    ],
  },
  {
    key: 'dld-kmaps',
    title: 'Karnaugh Maps and Combinational Circuits',
    description:
      'Boolean simplification with K-maps (including don’t-cares), and design of adders, multiplexers and decoders.',
    subject: 'Digital Logic Design',
    course: 'EE-221',
    semester: 3,
    resourceType: ResourceType.NOTES,
    tags: ['k-map', 'boolean algebra', 'multiplexer', 'adder'],
    uploader: 'hamza',
    status: 'approved',
    sections: [
      {
        heading: 'Karnaugh maps',
        paragraphs: [
          'A K-map arranges a truth table so that adjacent cells differ in exactly one variable (Gray code order: 00, 01, 11, 10). Grouping adjacent 1s in rectangles of size 1, 2, 4, 8… eliminates the variables that change within the group, giving a minimal sum of products.',
          'Rules: groups must be powers of two; make each group as large as possible; use as few groups as possible; groups may overlap and wrap around the edges. Don’t-care cells (X) may be included in a group when that makes it larger, but need not be covered.',
          'Example: F(A, B, C) = Σm(1, 3, 5, 7) has 1s wherever C = 1, so the single group of four gives F = C.',
        ],
      },
      {
        heading: 'Combinational building blocks',
        paragraphs: [
          'Half adder: S = A ⊕ B, C = A·B. Full adder: S = A ⊕ B ⊕ Cin and Cout = A·B + Cin·(A ⊕ B). Chaining n full adders gives an n-bit ripple-carry adder whose delay grows linearly with n; carry-lookahead adders reduce this.',
          'A 2^n-to-1 multiplexer selects one of 2^n inputs using n select lines; any Boolean function of n variables can be built from a 2^n-to-1 MUX by wiring the truth-table outputs to its inputs. A decoder turns an n-bit input into one active output out of 2^n and, with an OR gate, can implement any function in sum-of-minterms form.',
        ],
      },
    ],
  },
  {
    key: 'pf-lab5',
    title: 'Lab 5: Arrays and Functions in C++',
    description:
      'Lab handout with exercises on 1D/2D arrays, passing arrays to functions and a small grade-report program.',
    subject: 'Programming Fundamentals',
    course: 'CS-101',
    semester: 1,
    resourceType: ResourceType.LAB,
    tags: ['c++', 'arrays', 'functions', 'lab'],
    uploader: 'usman',
    status: 'approved',
    sections: [
      {
        heading: 'Objectives',
        paragraphs: [
          'Declare and initialize arrays; traverse them with loops; pass arrays to functions; and understand why an array argument is effectively passed by reference.',
        ],
      },
      {
        heading: 'Background',
        paragraphs: [
          'int marks[5] = {78, 91, 64, 85, 70}; creates five integers indexed 0 to 4. Reading marks[5] is out of bounds and undefined behaviour — C++ does not check indices for you.',
          'When you pass an array to a function, only a pointer to its first element is passed, so the function must also receive the size: double average(const int a[], int n). Marking the parameter const prevents the function from modifying the caller’s data by accident.',
          'A 2D array int grid[3][4] is stored row by row. When passing it, every dimension except the first must be given: void print(int g[][4], int rows). std::vector is usually preferable in real code because it knows its own size.',
        ],
      },
      {
        heading: 'Tasks',
        paragraphs: [
          'Task 1: Write int findMax(const int a[], int n) and test it on at least three arrays, including one with all negative values.',
          'Task 2: Write void reverse(int a[], int n) that reverses the array in place using two indices moving toward each other.',
          'Task 3 (graded): Read the marks of n students (n <= 50) into an array. Print the average, the highest and lowest marks, and a letter grade for each student (A >= 85, B >= 70, C >= 55, D >= 50, F otherwise). Use a separate function for each calculation.',
        ],
      },
    ],
  },
  // ── Moderation queue for the admin demo ─────────────────────────────────
  {
    key: 'net-subnetting',
    title: 'Subnetting and CIDR Practice Sheet',
    description:
      'Practice problems on subnet masks, CIDR blocks and VLSM, with answers.',
    subject: 'Computer Networks',
    course: 'CS-341',
    semester: 5,
    resourceType: ResourceType.ASSIGNMENT,
    tags: ['subnetting', 'CIDR', 'IP addressing'],
    uploader: 'hamza',
    status: 'pending',
    sections: [
      {
        heading: 'Problems',
        paragraphs: [
          '1. How many usable hosts does a /26 network have? Answer: 2^(32−26) − 2 = 62.',
          '2. Split 192.168.10.0/24 into four equal subnets. Answer: /26 each — 192.168.10.0, .64, .128 and .192.',
          '3. Which subnet does 10.4.37.200/20 belong to? Answer: the third octet 37 lies in the block 32–47, so the network is 10.4.32.0/20 and the broadcast address is 10.4.47.255.',
        ],
      },
    ],
  },
  {
    key: 'se-uml',
    title: 'UML Diagrams Cheat Sheet',
    description:
      'Class, sequence, use case and activity diagram notation on one page.',
    subject: 'Software Engineering',
    course: 'CS-352',
    semester: 6,
    resourceType: ResourceType.NOTES,
    tags: ['UML', 'class diagram', 'sequence diagram'],
    uploader: 'usman',
    status: 'pending',
    sections: [
      {
        heading: 'Notation',
        paragraphs: [
          'Class diagram: association is a plain line, aggregation a hollow diamond, composition a filled diamond at the whole’s end, and inheritance a hollow triangle pointing to the parent. Multiplicities such as 1, 0..1 and * are written at the line ends.',
          'Sequence diagram: lifelines are vertical dashed lines; synchronous calls are solid arrows with filled heads; returns are dashed arrows. Use case diagram: actors are stick figures; «include» and «extend» relate use cases.',
        ],
      },
    ],
  },
  {
    key: 'misc-rejected',
    title: 'my notes',
    description: 'notes',
    subject: 'Operating Systems',
    course: 'CS-311',
    semester: 5,
    resourceType: ResourceType.OTHER,
    tags: [],
    uploader: 'bilal',
    status: 'rejected',
    rejectionReason:
      'Please add a descriptive title and description, and check the file — it is a blank page.',
    sections: [{ heading: 'Untitled', paragraphs: ['(blank)'] }],
  },
];
