export function normalizeStepStatus(existing: boolean[] | undefined, stepCount: number): boolean[] {
  if (!existing) return Array.from({ length: stepCount }, () => false)
  return Array.from({ length: stepCount }, (_, idx) => Boolean(existing[idx]))
}

export function getPathProgress(stepStatus: boolean[], totalSteps: number) {
  const completedCount = stepStatus.filter(Boolean).length
  const progress = totalSteps ? Math.round((completedCount / totalSteps) * 100) : 0
  return { completedCount, totalSteps, progress }
}

export function isPathComplete(stepStatus: boolean[], totalSteps: number): boolean {
  return totalSteps > 0 && stepStatus.filter(Boolean).length >= totalSteps
}

export function getSessionProgressMeta(
  status: string,
  progressPercent: number,
  completedSteps?: number,
  totalSteps?: number
) {
  if (status === 'completed' || progressPercent >= 100) {
    return {
      label: 'Completed',
      pill: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
      progress: 100,
      progressColor: 'bg-emerald-500',
      progressLabel: 'Session completed ✓',
      progressLabelColor: 'text-emerald-400',
      action: 'View recap →',
    }
  }
  if (status === 'abandoned') {
    return {
      label: 'Paused',
      pill: 'bg-white/[0.06] border-white/[0.12] text-outline-variant',
      progress: 0,
      progressColor: 'bg-outline-variant',
      progressLabel: 'Paused session',
      progressLabelColor: 'text-outline-variant',
      action: 'Open session →',
    }
  }
  const hasSteps = totalSteps != null && totalSteps > 0 && completedSteps != null
  const stepLabel = hasSteps
    ? `${completedSteps} of ${totalSteps} steps done`
    : progressPercent > 0
      ? `${progressPercent}% complete`
      : 'Not started yet'

  return {
    label: progressPercent > 0 ? 'In progress' : 'Not started',
    pill: 'bg-primary-container/10 border-primary-container/25 text-primary-container',
    progress: Math.max(0, Math.min(100, progressPercent)),
    progressColor: 'bg-primary-container',
    progressLabel: stepLabel,
    progressLabelColor: 'text-outline-variant',
    action: 'Open session →',
  }
}
