import prisma from "../lib/db.js"

import type { createWorkspaceSchema } from "../validators/workspace.validator.js"
import type { updateWorkspaceSchema } from "../validators/workspace.validator.js"

export const workspaceSelect = {
    id:true,
    title:true,
    description:true,
    icon:true,
    defaultModel:true,
    createdAt:true,
    updatedAt:true
} as const

export type typeWorkspace={
    id: string;
    title:string;
    description:string|null;
    icon:string|null;
    defaultModel:string;
    createdAt:Date;
    updatedAt:Date;
}

export function findWorkspaceByUser(userId: string){
    return prisma.workspace.findMany({
        where:{userId},
        select:workspaceSelect,
        orderBy:{updatedAt:"desc"}
    })
}

export function findWorkspaceByIdandUserId(workspaceId:string, userId:string){
    return prisma.workspace.findFirst({
        where:{id:workspaceId, userId},
        select:workspaceSelect
    })
}

export function createWorkspace(userId:string, data:createWorkspaceSchema){
    return prisma.workspace.create({
        data: {
            ...data,
            defaultModel: data.defaultModel ?? "gpt-4o-mini",
            userId,
        },
        select: workspaceSelect,
    })
}

export function updateWorkspace(workspaceId:string, data:updateWorkspaceSchema){
    return prisma.workspace.update({
        where:{id:workspaceId},
        data,
        select:workspaceSelect
    })
}

export async function deleteWorkspace(workspaceId:string){
    await prisma.workspace.delete(
        {where:{id:workspaceId}}
    )
}
