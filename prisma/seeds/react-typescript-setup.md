---
title: "Setting up React with TypeScript"
shortId: "react-typescript-setup"
projects: ["React Component Library", "Full Stack Web Application"]
tags: ["Frontend", "Testing"]
---

# Setting up React with TypeScript

This recipe guides you through setting up a new React project with TypeScript from scratch.

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

## Steps

### 1. Create New React App
```bash
npx create-react-app my-app --template typescript
cd my-app
```

### 2. Install Additional Dependencies
```bash
npm install @types/react @types/react-dom
```

### 3. Configure TypeScript
Update `tsconfig.json` with strict settings:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Expected Outcome
- Fully configured React + TypeScript project
- Type-safe component development
- Better IDE support and error catching