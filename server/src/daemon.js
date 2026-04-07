import AgentTask from './models/AgentTask.js';
import { runVerificationAgent } from './agents/verification.js';
import { runECAgent } from './agents/ec.js';
import { runStampDutyAgent } from './agents/stampDuty.js';

const POLL_INTERVAL_MS = 5000; 

async function processPendingTasks() {
  try {
    // 1. Find ONE pending task to work on
    const task = await AgentTask.findOneAndUpdate(
      { status: 'pending' },
      { status: 'in_progress' },
      { returnDocument: 'after' } 
    );

    // If no task is found, exit quietly
    if (!task) return; 

    console.log(`[Daemon] 🛠️ Processing: ${task.taskName} (${task.assignedAgent})`);

    let output = null;

    // 2. ROUTING: Now that we have a 'task', we decide which agent to run
    if (task.assignedAgent === 'Verification_Agent') {
      output = await runVerificationAgent(task.inputPayload);
    } else if (task.assignedAgent === 'EC_Agent') {
      output = await runECAgent(task.inputPayload);
    } else if (task.assignedAgent === 'Stamp_Duty_Agent') {
      output = await runStampDutyAgent(task.inputPayload);
    }

    // 3. Update task as completed
    task.agentOutput = output;
    task.status = 'completed';
    await task.save();
    console.log(`[Daemon] ✅ Completed: ${task.taskName}`);

    // 4. DAG LOGIC: Unblock downstream dependencies
    // Remove this task's name from any 'dependsOn' arrays
    await AgentTask.updateMany(
      { status: 'blocked', dependsOn: task.taskName },
      { $pull: { dependsOn: task.taskName } }
    );

    // If a blocked task now has an empty dependency array, move it to 'pending'
    await AgentTask.updateMany(
      { status: 'blocked', dependsOn: { $size: 0 } },
      { status: 'pending' }
    );

    // 5. CHECK FOR GLOBAL COMPLETION
    // If all tasks for this contract are 'completed', merge results into the main Contract
    const remainingTasks = await AgentTask.countDocuments({ 
      contractId: task.contractId, 
      status: { $ne: 'completed' } 
    });

    if (remainingTasks === 0) {
      console.log(`[Daemon] 🏁 All agents finished for Contract: ${task.contractId}`);
      
      const allFinishedTasks = await AgentTask.find({ contractId: task.contractId });
      const finalReport = {};
      
      allFinishedTasks.forEach(t => {
        finalReport[t.assignedAgent] = t.agentOutput;
      });

      await Contract.findByIdAndUpdate(task.contractId, {
        status: 'completed',
        finalAnnotations: finalReport
      });
    }


  } catch (error) {
    console.error(`[Daemon] ❌ Execution Error:`, error);
    // Note: In production, you'd set the task status back to 'pending' 
    // or 'failed' here so it doesn't get stuck in 'in_progress'
  }
}

export function startDaemon() {
  console.log('🤖 Worker Daemon started. Polling MongoDB every 5s...');
  setInterval(processPendingTasks, POLL_INTERVAL_MS);
}