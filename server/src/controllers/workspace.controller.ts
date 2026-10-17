import { listWorkspaceByUserId, updateWorkspaceForUser, getWorkspaceByIdForUser, createWorkspaceForUser, deleteWorkspaceForUser } from "../services/workspace.service.js";
import type {Request, Response} from "express";
import { ValidationError } from "../types/app-error.js";
import { getZodFieldErrors } from "../utils/zod-error.js";
import { createWorkspaceSchema, updateWorkspaceSchema, workspaceIdParamSchema } from "../validators/workspace.validator.js";

function parseWorkSpaceId(params:Request["params"]){
    const parsed = workspaceIdParamSchema.safeParse(params);
    if(!parsed.success){
        throw new ValidationError("Invalid workspaceId", getZodFieldErrors(parsed.error));
    }
    return parsed.data;
}

function parseCreateBody(body:unknown){
    const parsed = createWorkspaceSchema.safeParse(body);
    if(!parsed.success){
        throw new ValidationError(
            "Validation Failed",
            getZodFieldErrors(parsed.error)
        )
    }
    return parsed.data;
}

function parsedUpdateBody(body:unknown){
    const parsed = updateWorkspaceSchema.safeParse(body);
    if(!parsed.success){
        throw new ValidationError(
            "Validation Failed",
            getZodFieldErrors(parsed.error)
        )
    }
    return parsed.data;
}

export async function listWorkspaces(req:Request, res:Response){
    const workspace = await listWorkspaceByUserId(req.session.user.id);
    res.json(workspace);
}

export async function getWorkspace(req:Request, res:Response){
    const {workspaceId} = parseWorkSpaceId(req.params);
    const workspace = await getWorkspaceByIdForUser(workspaceId, req.session.user.id);
    res.json(workspace);
}

export async function createWorkspace(req:Request, res:Response){
    const input = parseCreateBody(req.body);
    const workspace = await createWorkspaceForUser(req.session.user.id,input);
    res.status(201).json(workspace);
}

export async function updateWorkspace(req: Request, res: Response) {
    const { workspaceId } = parseWorkSpaceId(req.params);
    const input = parsedUpdateBody(req.body);
    const workspace = await updateWorkspaceForUser(
        workspaceId,
        req.session.user.id,
        input,
    );
    res.json(workspace);
}

export async function deleteWorkspace(req: Request, res: Response) {
    const { workspaceId } = parseWorkSpaceId(req.params);
    await deleteWorkspaceForUser(workspaceId, req.session.user.id);
    res.status(204).send();
}