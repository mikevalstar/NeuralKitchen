import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export const Route = createFileRoute("/recipes/create")({
  component: RecipeCreate,
});

function RecipeCreate() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/recipes">Recipes</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create Recipe</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Recipe</h1>
          <p className="text-muted-foreground">Create a new AI agent recipe</p>
        </div>
      </div>

      {/* Stub Content */}
      <Card>
        <CardHeader>
          <CardTitle>Recipe Creation</CardTitle>
          <CardDescription>This page will contain the recipe creation form</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="text-6xl">🚧</div>
            <h3 className="text-lg font-medium">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              The recipe creation interface is under development. This will include a markdown editor for writing AI
              agent instructions and workflows.
            </p>
            <Link to="/recipes">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Recipes
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
