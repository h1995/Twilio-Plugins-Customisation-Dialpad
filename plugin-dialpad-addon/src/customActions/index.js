import { Actions } from '@twilio/flex-ui';
import { acceptInternalTask, rejectInternalTask, isInternalCall, toggleHoldInternalCall } from './internalCall';
import { kickExternalTransferParticipant } from './externalTransfer';
import ConferenceService from '../helpers/ConferenceService';
import moment from 'moment';
export default (manager) => {
	Actions.addListener('beforeAcceptTask', (payload, abortFunction) => {
		const reservation = payload.task.sourceObject;

		if (isInternalCall(payload)) {
			abortFunction();

			acceptInternalTask({ reservation, payload });
		}
	});

	Actions.addListener('beforeRejectTask', (payload, abortFunction) => {
		if (isInternalCall(payload)) {
			abortFunction();

			rejectInternalTask({ manager, payload });
		}
	});

	const holdCall = (payload, hold) => {
		return new Promise((resolve, reject) => {
			const task = payload.task;

			if (hold) {
				payload.task.setAttributes({
					...payload.task.attributes,
					onHoldTime: moment(),
					onHold: true
				});
			} else {
				const onHoldTime = moment(payload.task.attributes.onHoldTime);
				const unHoldTime = moment();
				const longestHold = unHoldTime.diff(onHoldTime, 'seconds');
				const onHoldDuration = payload.task.attributes.onHoldDuration
					? unHoldTime.diff(onHoldTime, 'seconds') + parseInt(payload.task.attributes.onHoldDuration)
					: unHoldTime.diff(onHoldTime, 'seconds');
				payload.task.setAttributes({
					...payload.task.attributes,
					unHoldTime: moment(),
					onHoldDuration: onHoldDuration,
					longestHold: longestHold,
					onHold: false
				});
			}

			if (isInternalCall(payload)) {
				toggleHoldInternalCall({
					task,
					manager,
					hold,
					resolve,
					reject
				});
			} else {
				resolve();
			}
		});
	};

	Actions.addListener('beforeHoldCall', (payload) => {
		return holdCall(payload, true);
	});

	Actions.addListener('beforeUnholdCall', (payload) => {
		console.log("BEFORE UNHOLD CALL", payload);
		return holdCall(payload, false);
	});

	Actions.addListener('beforeHoldParticipant', async (payload, abortFunction) => {
		const { participantType, targetSid: participantSid, task } = payload;

		console.log('beforeHoldParticipant', payload.task);

		await payload.task.setAttributes({
			...payload.task.attributes,
			onHoldTime: moment(),
			onHold: true
		});

		console.log('task updated', payload.task);

		if (participantType !== 'unknown') {
			return;
		}

		const { conferenceSid } = task.conference;
		abortFunction();

		return ConferenceService.holdParticipant(conferenceSid, participantSid);
	});

	Actions.addListener('beforeUnholdParticipant', async (payload, abortFunction) => {
		console.log("BEFORE UNHOLD PARTICIPANT", payload);
		const { participantType, targetSid: participantSid, task } = payload;
		console.log('beforeUnholdParticipant', payload.task);
		const onHoldTime = moment(payload.task.attributes.onHoldTime);
		const unHoldTime = moment();
		const longestHold = unHoldTime.diff(onHoldTime, 'seconds');
		const onHoldDuration = payload.task.attributes.onHoldDuration
			? unHoldTime.diff(onHoldTime, 'seconds') + parseInt(payload.task.attributes.onHoldDuration)
			: unHoldTime.diff(onHoldTime, 'seconds');
		await payload.task.setAttributes({
			...payload.task.attributes,
			unHoldTime: moment(),
			onHoldDuration: onHoldDuration,
			longestHold: longestHold,
			onHold: false
		});
		console.log('task updated', payload.task);
		if (participantType !== 'unknown') {
			return;
		}
		const { conferenceSid } = task.conference;
		abortFunction();
		return ConferenceService.unholdParticipant(conferenceSid, participantSid);
	});

	Actions.addListener('beforeKickParticipant', (payload, abortFunction) => {
		const { participantType } = payload;

		if (participantType !== 'transfer' && participantType !== 'worker') {
			abortFunction();

			kickExternalTransferParticipant(payload);
		}
	});
};