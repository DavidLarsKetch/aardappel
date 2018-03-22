# Aardappel

## Summary
Aardappel is a tool for writing teams to suggest edits to each other's work in a stream-lined, mobile-friendly manner. A writer or editor can create and join multiple writing teams and post, edit and approve documents on those respective teams. Unlike popular desktop applications or web-browser applications like Microsoft Word or Google Docs, Aardappel delivers an intuitive, distraction-free experience to its users' mobile devices.

## Live Demo
1. Go to (aardappel-nss.firebaseapp.com) *Google Chrome support only*
1. EITHER (1) register a new user OR (2) logon with `a@a.com`, `b@b.com`, `c@c,com`, `d@d.com`, or `e@e.com` (password: `password`)
1. Want to join a new team? Use `password`! It's super secure
1. Want to create a new team? Go for it! Please use `password` as the password so other users can join your team as well!
1. Lastly, explore and see how quickly you can break the app! (Record: 3 seconds)

# Retrospective
## Background
Aardappel was the first, extensive project I built without a team. I built this over a two-week period in late February as part of my capstone to the front-end portion of Nashville Software School's Full-Stack Developer bootcamp. Thus, there is no back-end layer - aside from Firebase storage and deployment.

## Stack
- `AngularJS` (Angular 1.x)
- `SASS`
- `Firebase`

### Achievements
- King Structure
  - Implementing a clear, logical file structure, the relationship between files, etc. was an overarching goal for the project. For example, I've never understood a coherent way to organize `SASS`. Then, I met [`BEM`](http://getbem.com/). This provided me an intuitive way of organizing `CSS` rules in my `HTML` templates and `SASS` files. 

- You Have Won Second Prize in a Beauty Contest Collect $10
  - I don't have a strong background in design. I wanted the UI to be clean and clear. I believe users of Aardappel will agree.

- RTFM
  - I want to pick up Aardappel in six months, know where I was, and where I am going with development. Setting a foundation with good commit messages, pull request, issue tracking and keeping a project board was essential. While I could improve in this area, Aardappel was my first attempt at this.

- ES6 Knowledge is 9,000!
  - I pushed the envelope on what I knew about JavaScript ES6 and beyond while staying within the `AngularJS` way. Knowing the ins-and-outs of each was pivotal

- At Least it Floats
  - Using `AngularJS` is like an archaelogical dig. I reached new heights by learning how to build custom directives, services, etc.

### Lessons Learned
- Know why you're using a technology
  - Using AngularJS proved to have significant limitations with regard to manipulating text in the way the app needed. I chose it initially because it was the only `JavaScript` framework I knew at the time & wanted to delve deeper into using `JavaScript` frameworks to build apps.

- QA is tough - don't underestimate it
  - I underestimated the variety of user inputs available in this app, or at least, how robustly my code was able to handle that variety. Choosing a project with a high degree of QA awareness & ability to meet that early in my career was a bit short-sighted. 

- Get in early on TDD
  - Only near the end of my project did I learn about test-driven development & how to leverage it properly. This methodology and the tools it implements - `Mocha` and `Chai` in the `JavaScript` context - could have proven invaluable in building out the core logic of transforming user interactions into the data being saved in a more robust fashion.
