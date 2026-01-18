import { ProjectState } from '../models/Project.js';

export interface StateTransition {
  from: ProjectState;
  to: ProjectState;
  allowedRoles: string[];
  conditions?: (project: any) => boolean;
}

export const PROJECT_STATE_TRANSITIONS: StateTransition[] = [
  {
    from: ProjectState.DRAFT,
    to: ProjectState.ACTIVE,
    allowedRoles: ['CLIENT', 'ADMIN'],
  },
  {
    from: ProjectState.ACTIVE,
    to: ProjectState.IN_REVIEW,
    allowedRoles: ['FREELANCER', 'CLIENT', 'ADMIN'],
  },
  {
    from: ProjectState.IN_REVIEW,
    to: ProjectState.COMPLETED,
    allowedRoles: ['CLIENT', 'ADMIN'],
  },
  {
    from: ProjectState.IN_REVIEW,
    to: ProjectState.ACTIVE,
    allowedRoles: ['CLIENT', 'ADMIN'],
  },
  {
    from: ProjectState.ACTIVE,
    to: ProjectState.DISPUTED,
    allowedRoles: ['CLIENT', 'FREELANCER'],
    conditions: (project) => project.accountabilityMode === 'ACCOUNTABILITY',
  },
  {
    from: ProjectState.DISPUTED,
    to: ProjectState.ACTIVE,
    allowedRoles: ['ADMIN'],
  },
  {
    from: ProjectState.DISPUTED,
    to: ProjectState.CLOSED,
    allowedRoles: ['ADMIN'],
  },
  {
    from: ProjectState.ACTIVE,
    to: ProjectState.CLOSED,
    allowedRoles: ['ADMIN'],
  },
  {
    from: ProjectState.COMPLETED,
    to: ProjectState.CLOSED,
    allowedRoles: ['ADMIN'],
  },
];

export const canTransition = (
  from: ProjectState,
  to: ProjectState,
  userRole: string,
  project?: any
): boolean => {
  const transition = PROJECT_STATE_TRANSITIONS.find(
    (t) => t.from === from && t.to === to
  );

  if (!transition) {
    return false;
  }

  if (!transition.allowedRoles.includes(userRole)) {
    return false;
  }

  if (transition.conditions && project) {
    return transition.conditions(project);
  }

  return true;
};

export const getAvailableTransitions = (
  currentState: ProjectState,
  userRole: string,
  project?: any
): ProjectState[] => {
  return PROJECT_STATE_TRANSITIONS
    .filter((t) => t.from === currentState && canTransition(currentState, t.to, userRole, project))
    .map((t) => t.to);
};
