import * as React from 'react';
import { connect } from 'react-redux';
import styled from '@emotion/styled';
import axios from 'axios';
import { Actions, IconButton, TaskHelper, VERSION as FlexVersion, withTheme, Manager } from '@twilio/flex-ui';

const manager = Manager.getInstance();

const ActionsContainer = styled('div')`
  min-width: 88px;
  margin-top: 10px;
  button {
      width: 36px;
      height: 36px;
      margin-left: 6px;
      margin-right: 6px;
  }
`;

const ActionsContainerListItem = styled('div')`
  min-width: 88px;
  button {
    width: 32px;
    height: 32px;
    margin-left: 6px;
    margin-right: 6px;
  }
`;

class ParticipantActionsButtons extends React.Component {
	componentWillUnmount() {
		const { participant } = this.props;
		console.log('componentWillUnmount');
		console.log(this.props);
		if (participant.status === 'recently_left') {
			this.props.clearParticipantComponentState();
		}
	}

	showKickConfirmation = () => this.props.setShowKickConfirmation(true);

	hideKickConfirmation = () => this.props.setShowKickConfirmation(false);

	onHoldParticipantClick = () => {
		const { participant, task } = this.props;
		const { callSid, workerSid } = participant;
		const participantType = participant.participantType;
		console.log('participant----', participant);
		if (participantType === 'customer') {
			axios
				.post('https://' + manager.serviceConfiguration.runtime_domain + '/toggle-hold', {
					conferenceSid: this.props.task.conference.conferenceSid,
					participantSid: participant.callSid,
					hold: participant.onHold ? false : true
				})
				.then((res) => {
					console.log('done api call----', res);
				})
				.catch((e) => {
					console.log('done api error call----', e);
				});
		} else {
			Actions.invokeAction(participant.onHold ? 'UnholdParticipant' : 'HoldParticipant', {
				participantType,
				task,
				targetSid: participantType === 'worker' ? workerSid : callSid
			});
		}
	};

	// _getUserToken = () => {
	//   const manager = Manager.getInstance();
	//   return manager.user.token;
	// }

	onKickParticipantConfirmClick = () => {
		const { participant, task } = this.props;
		const { callSid, workerSid } = participant;
		const { participantType } = participant;
		Actions.invokeAction('KickParticipant', {
			participantType,
			task,
			targetSid: participantType === 'worker' ? workerSid : callSid
		});
		this.hideKickConfirmation();
	};

	renderKickConfirmation() {
		return (
			<React.Fragment>
				<IconButton
					icon="Accept"
					className="ParticipantCanvas-AcceptAction"
					onClick={this.onKickParticipantConfirmClick}
					themeOverride={this.props.theme.ParticipantsCanvas.ParticipantCanvas.Button}
				/>
				<IconButton
					icon="Close"
					className="ParticipantCanvas-DeclineAction"
					onClick={this.hideKickConfirmation}
					themeOverride={this.props.theme.ParticipantsCanvas.ParticipantCanvas.Button}
				/>
			</React.Fragment>
		);
	}

	renderActions() {
		const { participant, theme, task } = this.props;

		const holdParticipantTooltip = participant.onHold ? 'Unhold Participant' : 'Hold Participant';
		const kickParticipantTooltip = 'Remove Participant';

		// The name of the hold icons changed in Flex 1.11.0 to HoldOff.
		// Since the minimum requirement is 1.10.0 and there is no version between
		// 1.10.0 and 1.11.0, the check is only needed for version 1.10.0.
		const holdIcon = FlexVersion === '1.10.0' ? 'HoldLarge' : 'Hold';
		const unholdIcon = FlexVersion === '1.10.0' ? 'HoldLargeBold' : 'HoldOff';

		return (
			<React.Fragment>
				<IconButton
					icon={participant.onHold ? `${unholdIcon}` : `${holdIcon}`}
					className="ParticipantCanvas-HoldButton"
					// disabled={!TaskHelper.canHold(task) || (participant.status !== 'joined') }
					onClick={this.onHoldParticipantClick}
					themeOverride={theme.ParticipantsCanvas.ParticipantCanvas.Button}
					title={holdParticipantTooltip}
				/>
				<IconButton
					icon="Hangup"
					className="ParticipantCanvas-HangupButton"
					onClick={this.showKickConfirmation}
					themeOverride={theme.ParticipantsCanvas.ParticipantCanvas.HangUpButton}
					title={kickParticipantTooltip}
				/>
			</React.Fragment>
		);
	}

	render() {
		return this.props.listMode ? (
			<ActionsContainerListItem className="ParticipantCanvas-Actions">
				{this.props.showKickConfirmation ? this.renderKickConfirmation() : this.renderActions()}
			</ActionsContainerListItem>
		) : (
			<ActionsContainer className="ParticipantCanvas-Actions">
				{this.props.showKickConfirmation ? this.renderKickConfirmation() : this.renderActions()}
			</ActionsContainer>
		);
	}
}

const mapStateToProps = (state, ownProps) => {
	const { participant } = ownProps;
	const componentViewStates = state.flex.view.componentViewStates;
	const customParticipants = componentViewStates.customParticipants || {};
	const participantState = customParticipants[participant.callSid] || {};
	const customParticipantsState = {};

	return {
		showKickConfirmation: participantState.showKickConfirmation,
		setShowKickConfirmation: (value) => {
			customParticipantsState[participant.callSid] = {
				...participantState,
				showKickConfirmation: value
			};
			Actions.invokeAction('SetComponentState', {
				name: 'customParticipants',
				state: customParticipantsState
			});
		},
		clearParticipantComponentState: () => {
			customParticipantsState[participant.callSid] = undefined;
			Actions.invokeAction('SetComponentState', {
				name: 'customParticipants',
				state: customParticipantsState
			});
		}
	};
};

export default connect(mapStateToProps)(withTheme(ParticipantActionsButtons));
