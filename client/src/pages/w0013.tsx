import { useQuery } from "@tanstack/react-query";
import TimelineCard from "@/components/project-timeline/timeline-card";

interface Project {
  id: number;
  projectNumber: string;
  name: string;
  description?: string;
  status: string;
  value?: string;
  retention?: string;
  startOnSiteDate?: string;
  contractCompletionDate?: string;
  constructionCompletionDate?: string;
  postcode?: string;
}

export default function W0013() {
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Find the W0013 project
  const w0013Project = projects?.find(p => p.projectNumber === "W0013");

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8">
        <div>Loading...</div>
      </div>
    );
  }

  if (!w0013Project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8">
        <div>Project W0013 not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">W0013 - Municipal Water Treatment</h1>
    </div>
  );
}