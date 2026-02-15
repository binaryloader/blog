---
title: "[Column] 'We Can't Build It Without a Developer' No Longer Holds"
ref: the-end-of-developer-scarcity
excerpt: "AI coding tools have completely reshaped developer scarcity. Where does a developer's value lie now?"
date: 2026-02-14T23:55+09:00
last_modified_at: 2026-02-15T16:11+09:00
published: true
lang: en
permalink: /en/:categories/:title/
header:
  overlay_image: "/assets/image/thumbnail/header/the-end-of-developer-scarcity.png"
  overlay_filter: "0"
  teaser: "/assets/image/thumbnail/teaser/en/the-end-of-developer-scarcity.png"
categories:
  - Writing
  - Column
tags:
  - AI
  - Career
  - Column
depth:
  - title: "Writing"
    url: /en/writing/
  - title: "Column"
    url: /en/writing/column/
---

# Overview

AI coding tools have completely reshaped developer scarcity. What matters now isn't the ability to write code, but knowing what to build.

# The Golden Age of Developers Is Over

Let's be honest. The golden age of developers is over.

Just two or three years ago, "We have the idea but no developer" was the most legitimate excuse for not launching a startup. There was a clear asymmetry between planners and developers, and developers held advantageous positions thanks to their scarcity. The idea of a non-engineer touching code was unthinkable.

Now look around.

ChatGPT, Claude, Cursor, Bolt, Lovable, v0. These tools have changed everything. People who have never written a line of code are deploying web services in a single day. College students are shipping SaaS products over the weekend. Designers are building their own frontends. This is not an exaggeration — it's what's happening every day, right now.

This phenomenon already has a name. Vibe coding. Coined by OpenAI co-founder Andrej Karpathy, the term describes a style of programming where you describe what you want in natural language and accept whatever the AI generates — without even reading the code. We've entered an era where software gets built without anyone looking at the source.

# MVP Validation Is Now Open to Everyone

What is the essence of a startup? Throwing an idea at the market quickly and checking the response. MVP (Minimum Viable Product) validation. In the past, even this step was impossible without a developer. You needed a frontend developer just for a simple landing page and a backend developer to hook up a server.

Not anymore. Tell an AI "Build me a to-do app with sign-up" and you get a working prototype in five minutes. Say "Add payments" and it generates Stripe integration code. Firebase, Supabase, Vercel deployment — AI walks you through all of it.

A developer is no longer a prerequisite for MVP validation. We've entered an era where the person with the idea can build, test, and pivot on their own. Planners, marketers, designers, domain experts — anyone can turn their idea into a product.

This is already happening. Solo non-technical founders are generating revenue using nothing but AI tools, and new cases pop up every day. Ideas that would have been abandoned for lack of a technical co-founder are now making it to market on their own.

# "But What About Maintenance?"

There's a counter-argument that always comes up at this point.

"AI-generated code is spaghetti code."  
"Who's going to maintain it?"  
"Scalability, security, architecture… you can't ignore software engineering."

Fair points. All valid. But the timing of when those concerns matter is different.

A service that needs maintenance is a service that has already succeeded. A service that needs to worry about scalability is one that users are flocking to. A service that needs a security audit is one where money is changing hands. The vast majority of startups die before they ever reach the maintenance stage. We've seen countless services with perfect architecture, clean code, and 90% test coverage get ignored by the market and disappear.

It comes down to this: engineering excellence is something you need "after succeeding," not necessarily a prerequisite "in order to succeed." When you succeed, hire developers then. Refactor then. Redesign the architecture then. It's well known that many Silicon Valley unicorns started with terrible codebases. Facebook, Twitter, Airbnb — their early code was a mess. But they survived. They fixed it after surviving.

What matters is getting the product out into the world. Not writing perfect code, but finding what customers want. Code quality comes after.

# Not About Abandoning CS

Make no mistake. This isn't saying that deep, challenging CS domains like engineering mathematics, computer architecture, automata theory, compiler theory, and modern cryptography have become useless.

Quite the opposite. In an era where AI handles code generation, understanding why that code behaves the way it does becomes even more critical. To figure out why an AI-generated query is slow, you need to be able to read execution plans and understand index structures. To judge whether AI-written encryption logic is actually secure, you need to understand cryptographic principles. To determine whether an AI-recommended architecture can handle your traffic, you need knowledge of memory hierarchies and network protocols.

What's changed is when this knowledge matters. In the past, you had to understand variables and loops before writing a single line. CS knowledge was a prerequisite "to get started." Now it's a prerequisite "to go deeper." AI can handle the MVP-and-validate stage, but serving that product reliably to hundreds of thousands of users still requires people with strong foundations.

The gap between someone who can throw prompts at an AI and someone who can evaluate and improve what the AI generates — that gap is CS knowledge. It hasn't disappeared; it's shifted from the "entry point" to the "deep end."

# The Real Crisis for Developers: The End of Scarcity

There was only one core reason developers commanded high compensation: there were few people who could write code. Demand was exploding while supply was short, so naturally the price went up.

AI coding tools have completely eliminated that supply shortage. Now anyone with internet access can "write" code. The act of writing code itself is no longer a specialized skill.

This is a historically recurring pattern. Before the printing press, scribes who could copy texts were rare and valuable. There was an era when typists were considered professionals. When computers became widespread, those roles vanished. When a skill becomes democratized, the scarcity of those who possess it evaporates. Coding is following the same path.

Of course, senior developers, infrastructure engineers, and security specialists are still needed. But they're needed after a service has gained traction. At the early stage, AI has taken over a significant portion of what developers used to handle.

# Water Up to My Chin

I'm no exception to what I've been writing about.

I'm someone who likes to dig to the very bottom when studying development. I can't move on without understanding the underlying principles. I've built a kernel from scratch to implement my own operating system — that's the kind of developer I am. And yet, even I have been watching LLMs since their earliest days. From the GPT-2 era when it strung together awkward sentences, even when GPT-3 drew reactions of "this is something different," I shook my head at code generation demos. It couldn't even write a simple function properly — replace developers? When I actually used these tools for real work, the limitations were clear. They lost context, generated nonsensical code, and fell apart at the slightest complexity. The gap between impressive demos and real-world work was wider than people thought.

This pattern repeated with every new model. A splashy launch, stunning benchmarks, ecstatic reactions. Then the limits revealed themselves once you applied it to actual work. "Impressive, but still far off" was my conclusion every time. Honestly, I was skeptical about the prospect of AI replacing the entire development field. I believed coding was a fundamentally different problem from simply generating text. The ability to understand systems, maintain context, and grasp how hundreds of files interlock — I was convinced this was a domain LLMs couldn't reach.

As models advanced through generations, that conviction slowly wavered. Code assistants became increasingly useful and clearly saved time on repetitive tasks. "Maybe in five years the landscape will look quite different." Five became four. Four became three. Still, I felt relatively at ease, because I believed there was a fundamental difference between AI boosting developer productivity as an assistive tool and AI replacing developers altogether. I reassured myself that my lifespan as a developer was still considerable.

That was until just two months ago.

When I first used Claude Opus 4.6, two emotions hit me at once. This is serious. And this is exciting. The fear of my standing as a developer being shaken to its core. Yet at the same time, the thrill of realizing I could now have the kind of reassurance you feel working alongside dependable colleagues at the office — except available anywhere, 24 hours a day. It was like having several trustworthy, highly skilled technicians by my side at all times. There was something qualitatively different from previous models. I no longer needed to give detailed follow-up instructions on every output. Before, I had to meticulously review AI-generated code, make corrections, and go through rounds of re-prompting. Now it's different. I can review it the way I'd review a colleague's pull request — drop a single comment like "wouldn't this approach be better here?" — and that's enough. It grasps the intent precisely, maintains context, and delivers results that reflect the direction I suggested. Sometimes it even proposes a better approach than what I had in mind.

What sent a deeper chill down my spine was using a code review agent. Write up review guidelines in a document and run the agent, and it reviews code more thoroughly than I do. Naming consistency, missing error handling, potential performance issues, security vulnerabilities — things I miss when I'm tired or unfocused, the AI catches at the same quality level every time. An entity that follows my own guidelines more faithfully than I do. I was speechless at the irony.

For the past two months, I've been feeling a real crisis. This isn't some vague story about the future — it's a reality I'm experiencing every single day. AI is better today than yesterday. It will be better tomorrow than today. At this pace, even the three years I was comfortably counting down might be a luxurious expectation. The chilling thought that my lifespan as a developer may not have much left. Like water that had risen to my chin — the reality had crept up right in front of me before I noticed.

# The New Rules of the Game

The rules of the game have changed.

In the past, "the person who could build" won. Now, "the person who knows what to build" wins. The core skill is no longer technical ability but problem definition. Domain knowledge, customer understanding, market intuition — these have become far more important than coding ability.

A nurse with ten years of hospital experience knows the problems in healthcare better than anyone. A logistics manager knows exactly where the supply chain is inefficient. These people can now build solutions directly with AI tools — without the overhead of convincing a developer, writing specs, and paying communication costs.

Countless domain experts who were hidden behind the technology barrier have started solving problems in their own fields directly. They didn't lack understanding of the problem — they gave up because they "couldn't code." AI has torn down that barrier.

# So What Should We Do?

Faced with this shift, developers have two choices. Resist AI and insist that "real developers write their own code," or use AI as a lever to maximize their productivity. The gap between these two groups is widening fast.

Developers who embrace AI as a tool are doing the work of entire teams on their own. Instead of spending time on boilerplate, they design architectures and focus on business logic. They delegate repetitive implementation to AI and invest their energy in "what to build and why." These developers' market value is actually going up.

The key is a shift in positioning. From "person who writes code" to "person who solves problems with technology." Code is a means, not an end. Understanding what problem needs solving, designing the solution, and implementing it through whatever method is most efficient — whether AI or hand-written. That's the role developers will be expected to fill going forward.

So what should you invest in? Domain knowledge. Healthcare, finance, logistics, education. A developer who deeply understands a specific industry's problems cannot be replaced. A developer who only knows how to code can be substituted by AI, but someone who understands the industry context and can also make technical decisions — AI can't replace that. Standing at the intersection of technology and domain expertise. That's the new competitive advantage.

# Code Has Become a Tool, Not a Weapon

Saying the age of developers is over doesn't mean developers will disappear. But the era of "I'm special because I can code" is definitively over.

The people who survive in the AI age are not those who write code well, but those who know exactly what problem needs solving. Code is now like a pencil. Anyone can pick it up. What matters is what you write with it.

I want to ask developers: does your value lie in the act of writing code, or in the problems you solve with it? Your answer to that question will shape the direction you take from here.
