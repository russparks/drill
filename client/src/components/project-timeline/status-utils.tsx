// Utility functions for status colors and styling

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'tender': return 'rgb(59, 130, 246)'; // blue-500
    case 'precon': return 'rgb(34, 197, 94)'; // green-500
    case 'construction': return 'rgb(234, 179, 8)'; // yellow-500
    case 'aftercare': return 'rgb(107, 114, 128)'; // gray-500
    default: return 'rgb(156, 163, 175)'; // gray-400
  }
};

export const getStatusBackgroundColor = (status: string) => {
  switch (status) {
    case 'tender': return 'rgb(219, 234, 254)'; // blue-100
    case 'precon': return 'rgb(220, 252, 231)'; // green-100
    case 'construction': return 'rgb(254, 249, 195)'; // yellow-100
    case 'aftercare': return 'rgb(243, 244, 246)'; // gray-100
    default: return 'rgb(229, 231, 235)'; // gray-200
  }
};

export const getPhaseColor = (phase: string) => {
  switch (phase) {
    case 'tender': return '#3b82f6'; // blue-500
    case 'precon': return '#22c55e'; // green-500
    case 'construction': return '#eab308'; // yellow-500
    case 'aftercare': return '#6b7280'; // gray-500
    default: return '#9ca3af'; // gray-400
  }
};

export const formatCurrency = (value: string) => {
  const numValue = parseFloat(value.replace(/[£,]/g, ''));
  if (numValue < 0) {
    return `-£${Math.abs(numValue).toLocaleString()}`;
  }
  return `£${numValue.toLocaleString()}`;
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const calculateWeekInfo = (project: any) => {
  const startDate = new Date(project.startOnSiteDate);
  const contractDate = new Date(project.contractCompletionDate);
  const constructionDate = new Date(project.constructionCompletionDate);
  const currentDate = new Date();

  const totalWeeksToContract = Math.ceil((contractDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const totalWeeksToAnticipated = Math.ceil((constructionDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const currentWeek = Math.ceil((currentDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

  const retentionValue = parseFloat(project.retention?.replace(/[£,]/g, '') || '0');
  const hasPositiveRetention = retentionValue > 0;
  const hideWeekIndicator = hasPositiveRetention && project.status === 'aftercare';

  return {
    currentWeek: Math.max(1, currentWeek),
    totalWeeksToContract,
    totalWeeksToAnticipated,
    hasPositiveRetention,
    hideWeekIndicator
  };
};