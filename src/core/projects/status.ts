export const projectStatuses = ['maintained', 'experimental', 'unreleased'] as const;
export type ProjectStatus = (typeof projectStatuses)[number];
