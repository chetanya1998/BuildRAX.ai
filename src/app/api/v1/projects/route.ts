import { persistArchitectureProject } from "@/app/api/v1/guest-migrations/route";

/** Creates a first-class workspace project for an already authenticated user. */
export async function POST(request: Request) {
  return persistArchitectureProject(request, "project");
}
