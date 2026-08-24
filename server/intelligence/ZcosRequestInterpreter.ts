import { randomUUID } from "crypto";
import { ZCOS_INTELLIGENCE_SCHEMA_VERSION, type ZcosRequestEnvelope } from "../../shared/zcos-intelligence.js";

const FRESHNESS=/\b(current|currently|latest|today|tonight|this (?:week|month|year)|news|price|schedule|score|law|regulation|version|release|security advisory|officeholder)\b/i;
const HIGH=/\b(medical|diagnosis|medicine|legal|lawsuit|court|bankruptcy|tax|investment|trade|trading|financial|security|privacy|credential|production deletion)\b/i;
const ELEVATED=/\b(contract|insurance|employment|housing|credit|deploy|publish|send|delete|transfer|purchase)\b/i;
export interface ZcosRequestInput { traceId:string; userId:string; message:string; route:string; conversationId?:string; projectId?:string; requestedCapabilityIds?:string[]; channelPermissions?:{memory?:boolean;knowledge?:boolean;projects?:boolean;files?:boolean;externalRetrieval?:boolean}; externalActionsAuthorized?:boolean; authenticationSource?:"authenticated_session"|"verified_channel_binding"; }
export class ZcosRequestInterpreter {
  static interpret(input: ZcosRequestInput): ZcosRequestEnvelope {
    const message=String(input.message||"").trim(); if(!input.userId?.trim()) throw new Error("Authenticated owner is required."); if(!message) throw new Error("ZCOS request message is required.");
    return { schemaVersion:ZCOS_INTELLIGENCE_SCHEMA_VERSION, requestId:randomUUID(), traceId:input.traceId, submittedAt:new Date().toISOString(), originGalaxy:"ZAR", route:input.route,
      owner:{ownerUserId:input.userId,authenticationSource:input.authenticationSource||"authenticated_session"},
      intent:{kind:"governed_request",objective:message,explicitFreshness:FRESHNESS.test(message),stakes:HIGH.test(message)?"high":ELEVATED.test(message)?"elevated":"ordinary"},
      payload:{message,conversationId:input.conversationId,projectId:input.projectId,requestedCapabilityIds:input.requestedCapabilityIds},
      permissions:{memory:input.channelPermissions?.memory!==false,knowledge:input.channelPermissions?.knowledge!==false,projects:input.channelPermissions?.projects!==false,files:input.channelPermissions?.files!==false,externalRetrieval:input.channelPermissions?.externalRetrieval!==false,externalActions:input.externalActionsAuthorized===true} };
  }
}
