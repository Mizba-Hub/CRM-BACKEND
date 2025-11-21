
const asyncHandler = require("express-async-handler");
const CustomError = require("../../utils/customError");
const User = require("../../models/user");
const Lead = require("../../models/lead");
const Company = require("../../models/company");
const Ticket = require("../../models/ticket");
const Deal = require("../../models/deal");
const callRepository = require("../../repositories/activity/callRepository");
const callService = require("../../services/callService");
const Call = require("../../models/activity/call");
const { TARGET_TYPES, CALL_RESULTS } = Call.enums;

const buildTargetName = (record, targetType) => {
  if (!record) return null;

  switch (targetType) {
    case TARGET_TYPES.LEAD:
      return `${record.firstName ?? ""} ${record.lastName ?? ""}`.trim();
    case TARGET_TYPES.COMPANY:
      return record.companyName || null;
    case TARGET_TYPES.TICKET:
      return record.TicketName || record.ticketName || null;
    case TARGET_TYPES.DEAL:
      return record.dealName || null;
    default:
      return null;
  }
};

const resolveTargetDetails = async ({ targetType, targetId }) => {
  switch (targetType) {
    case TARGET_TYPES.LEAD: {
      const lead = await Lead.findByPk(targetId);
      if (!lead) return null;
      return {
        name: buildTargetName(lead, targetType),
        phoneNumber: lead.phoneNumber ?? null,
        raw: lead,
      };
    }
    case TARGET_TYPES.COMPANY: {
      const company = await Company.findByPk(targetId, {
        include: [{ association: "Lead", required: false }],
      });
      if (!company) return null;
      const phoneNumber =
        company.phoneNumber ?? company.Lead?.phoneNumber ?? null;
      return {
        name: buildTargetName(company, targetType),
        phoneNumber,
        raw: company,
      };
    }
    case TARGET_TYPES.TICKET: {
      const ticket = await Ticket.findByPk(targetId, {
        include: [
          { association: "Company", required: false },
          {
            model: Deal,
            as: "Deal",
            required: false,
            include: [{ association: "associatedLead", required: false }],
          },
        ],
      });
      if (!ticket) return null;

      const companyPhone = ticket.Company?.phoneNumber ?? null;
      const dealLeadPhone = ticket.Deal?.associatedLead?.phoneNumber ?? null;
      const phoneNumber = companyPhone ?? dealLeadPhone ?? null;

      return {
        name: buildTargetName(ticket, targetType),
        phoneNumber,
        raw: ticket,
      };
    }
    case TARGET_TYPES.DEAL: {
      const deal = await Deal.findByPk(targetId, {
        include: [{ association: "associatedLead", required: false }],
      });
      if (!deal) return null;

      const leadDetails = deal.associatedLead ?? null;
      const phoneNumber = leadDetails?.phoneNumber ?? null;

      return {
        name: buildTargetName(deal, targetType),
        phoneNumber,
        raw: deal,
        leadDetails,
      };
    }
    default:
      throw new CustomError("Invalid target type", 400, "INVALID_TARGET_TYPE");
  }
};

const formatCallResponse = (callInstance) => {
  const plain = callInstance.get({ plain: true });
  const user = plain.User;

  return {
    callId: plain.id,
    result: plain.result,
    user: user
      ? {
          id: String(user.id),
          name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
        }
      : null,
    target: {
      type: plain.targetType,
      id: plain.targetId,
      name: plain.targetName,
      phoneNumber: plain.targetPhone,
    },
    startedAt: plain.startedAt ? new Date(plain.startedAt).toISOString() : null,
    endedAt: plain.endedAt ? new Date(plain.endedAt).toISOString() : null,
    durationSeconds: plain.durationSeconds,
  };
};

const initiateCall = asyncHandler(async (req, res) => {
 const { userId, targetType, targetId, callerPhone, outcome } = req.body;

  if (!userId || !targetType || !targetId || !callerPhone) {
    throw new CustomError(
      "userId, targetType, targetId, and callerPhone are required",
      400,
      "INVALID_REQUEST"
    );
  }

  if (
    ![
      TARGET_TYPES.LEAD,
      TARGET_TYPES.COMPANY,
      TARGET_TYPES.TICKET,
      TARGET_TYPES.DEAL,
    ].includes(targetType)
  ) {
    throw new CustomError("Invalid target type", 400, "INVALID_TARGET_TYPE");
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new CustomError("User not found", 404, "USER_NOT_FOUND");
  }

  const targetDetails = await resolveTargetDetails({ targetType, targetId });
  if (!targetDetails) {
    throw new CustomError(
      `${targetType} with id ${targetId} not found`,
      404,
      "TARGET_NOT_FOUND"
    );
  }

  if (!targetDetails.phoneNumber) {
    throw new CustomError(
      "Target phone number not available",
      400,
      "TARGET_PHONE_MISSING"
    );
  }

  const providerResponse = await callService.initiateCall({
    callerPhone,
    targetPhone: targetDetails.phoneNumber,
  });

  const startedAt = providerResponse.startedAt ?? new Date();
  const endedAt = providerResponse.endedAt ?? null;
  const durationSeconds = providerResponse.durationSeconds ?? null;
  const result = outcome
  ? outcome.toLowerCase() === "successful"
    ? CALL_RESULTS.SUCCESSFUL
    : CALL_RESULTS.UNSUCCESSFUL
  : CALL_RESULTS.UNSUCCESSFUL;


  const callRecord = await callRepository.createCall({
    userId,
    targetType,
    targetId: String(targetId),
    targetName: targetDetails.name,
    targetPhone: targetDetails.phoneNumber,
    callerPhone,
    result,
    startedAt,
    endedAt,
    durationSeconds,
    twilioCallSid: providerResponse.sid,
  });

  await callRecord.reload({ include: [{ association: "User" }] });

  const responseBody = formatCallResponse(callRecord);
  res.status(200).json(responseBody);
});

const getCallById = asyncHandler(async (req, res) => {
  const call = await callRepository.findCallById(
    req.params.callId || req.params.id
  );
  if (!call) {
    throw new CustomError(
      `Call with id ${req.params.callId || req.params.id} not found`,
      404,
      "CALL_NOT_FOUND"
    );
  }

  const responseBody = formatCallResponse(call);
  res.status(200).json(responseBody);
});

const getCallsByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new CustomError("userId is required", 400, "INVALID_REQUEST");
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new CustomError("User not found", 404, "USER_NOT_FOUND");
  }

  const callList = await callRepository.findCallsByUserId(userId);
  const responseBody = callList.map((callInstance) =>
    formatCallResponse(callInstance)
  );

  res.status(200).json(responseBody);
});

const endCall = asyncHandler(async (req, res) => {
  const call = await callRepository.findCallById(
    req.params.callId || req.params.id
  );
  if (!call) {
    throw new CustomError(
      `Call with id ${req.params.callId || req.params.id} not found`,
      404,
      "CALL_NOT_FOUND"
    );
  }

  await callService.terminateCall({ twilioCallSid: call.twilioCallSid });

  const endedAt = new Date();
  const durationSeconds = call.startedAt
    ? Math.max(
        0,
        Math.round((endedAt.getTime() - call.startedAt.getTime()) / 1000)
      )
    : null;

  await callRepository.updateCall(call, {
    result: CALL_RESULTS.UNSUCCESSFUL,
    endedAt,
    durationSeconds,
  });

  res.status(200).json({
    callId: call.id,
    result: CALL_RESULTS.UNSUCCESSFUL,
  });
});

module.exports = {
  initiateCall,
  getCallById,
  getCallsByUserId,
  endCall,
};