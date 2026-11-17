import { BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthUser } from "../auth/decorators/current-user.decorator";

// Établissement auquel rattacher une nouvelle session (diagnostic ou module).
// - TRAINER / COLLABORATEUR : toujours son propre établissement (token), le body est ignoré.
// - ADMIN : l'établissement choisi dans le formulaire, obligatoire et vérifié. Sans ce
//   choix, la session tombait dans l'organisation de l'admin et l'établissement
//   ne retrouvait ni la session ni ses résultats.
export async function resolveSessionOrganization(
  prisma: PrismaService,
  requestedOrganizationId: string | undefined,
  user: AuthUser,
): Promise<string> {
  if (user.role !== "ADMIN") return user.organizationId;

  if (!requestedOrganizationId) {
    throw new BadRequestException("Choisissez l'établissement de la session");
  }
  const organization = await prisma.organization.findUnique({
    where: { id: requestedOrganizationId },
    select: { id: true },
  });
  if (!organization) throw new BadRequestException("Établissement introuvable");
  return organization.id;
}
