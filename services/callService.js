const twilio = require("twilio");
const { CALL_RESULTS } = require("../utils/activity/callConstants");
const CustomError = require("../utils/customError");

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_OUTBOUND_NUMBER,
} = process.env;

const successStatuses = new Set([
  "queued",
  "ringing",
  "in-progress",
  "completed",
]);

const failureStatuses = new Set([
  "busy",
  "failed",
  "no-answer",
  "canceled",
]);

const buildTwilioClient = () => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_OUTBOUND_NUMBER) {
    return null;
  }
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
};

const determineCallResult = (status) => {
  if (!status) {
    return CALL_RESULTS.UNSUCCESSFUL;
  }
  if (successStatuses.has(status)) {
    return CALL_RESULTS.SUCCESSFUL;
  }
  if (failureStatuses.has(status)) {
    return CALL_RESULTS.UNSUCCESSFUL;
  }
  return CALL_RESULTS.UNSUCCESSFUL;
};

const initiateCall = async ({ callId, callerPhone, targetPhone }) => {
  const client = buildTwilioClient();
  const now = new Date();

  if (!client) {
    const mockStartedAt = new Date();
    const mockEndedAt = new Date(mockStartedAt.getTime() + 2 * 60 * 1000);
    return {
      provider: "mock",
      sid: `mock-${callId}`,
      status: "completed",
      startedAt: mockStartedAt,
      endedAt: mockEndedAt,
      durationSeconds: Math.round(
        (mockEndedAt.getTime() - mockStartedAt.getTime()) / 1000
      ),
      result: CALL_RESULTS.SUCCESSFUL,
    };
  }

  try {
    const { VoiceResponse } = twilio.twiml;
    const voiceResponse = new VoiceResponse();
    const dial = voiceResponse.dial({ callerId: callerPhone });
    dial.number(targetPhone);

    const twilioCall = await client.calls.create({
      to: callerPhone,
      from: TWILIO_OUTBOUND_NUMBER,
      twiml: voiceResponse.toString(),
    });

    const status = twilioCall.status;
    const callDetails = status
      ? await client.calls(twilioCall.sid).fetch()
      : twilioCall;

    const startedAt = callDetails.startTime
      ? new Date(callDetails.startTime)
      : now;
    const endedAt = callDetails.endTime
      ? new Date(callDetails.endTime)
      : callDetails.status === "completed"
      ? new Date(callDetails.dateUpdated || Date.now())
      : null;

    const durationSeconds = callDetails.duration
      ? parseInt(callDetails.duration, 10)
      : endedAt && startedAt
      ? Math.max(
          0,
          Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
        )
      : null;

    return {
      provider: "twilio",
      sid: twilioCall.sid,
      status: callDetails.status,
      startedAt,
      endedAt,
      durationSeconds,
      result: determineCallResult(callDetails.status),
    };
  } catch (error) {
    throw new CustomError(
      `Failed to initiate call: ${error.message}`,
      502,
      "CALL_PROVIDER_ERROR"
    );
  }
};

const terminateCall = async ({ twilioCallSid }) => {
  const client = buildTwilioClient();
  if (!client || !twilioCallSid || twilioCallSid.startsWith("mock-")) {
    return;
  }

  try {
    await client.calls(twilioCallSid).update({ status: "completed" });
  } catch (error) {
    throw new CustomError(
      `Failed to terminate call: ${error.message}`,
      502,
      "CALL_PROVIDER_ERROR"
    );
  }
};

module.exports = {
  initiateCall,
  terminateCall,
};

