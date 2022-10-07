import * as React from 'react';
import { connect } from 'react-redux';
import styled from '@emotion/styled';
import { withTheme, templates, Template } from '@twilio/flex-ui';

const Status = styled('div')`
 font-size: 12px;
`;
const StatusListItem = styled('div')`
 font-size: 10px;
`;
const pad = (val) => {
	return val > 9 ? val : '0' + val;
};
class ParticipantStatus extends React.PureComponent {
	state = {
		intervalId: null
	};
	startTimer = () => {
		let { attributes } = this.props.task;
		let { uniqueId } = this.props.participant;
		if (!this.state.intervalId) {
			let sec = 0;
			let timer = setInterval(function() {
				document.getElementById(`seconds-${uniqueId}`)
					? (document.getElementById(`seconds-${uniqueId}`).innerHTML = pad(++sec % 60))
					: null;
				document.getElementById(`minutes-${uniqueId}`)
					? (document.getElementById(`minutes-${uniqueId}`).innerHTML = pad(parseInt(sec / 60, 10)))
					: null;
			}, 1000);
			// attributes[uniqueId] = {
			// 	intervalId: timer
			// };
			this.setState({ intervalId: timer });
			// this.props.task.setAttributes({
			// 	...attributes
			// });
		}
	};

	clearTimer = () => {
		let { attributes } = this.props.task;
		let { uniqueId } = this.props.participant;
		if (this.state.intervalId) {
			console.log('clear interval-----', uniqueId);
			clearInterval(this.state.intervalId);
			this.setState({ intervalId: null });
			// delete attributes[uniqueId];
			// this.props.task.setAttributes({
			// 	...attributes
			// });
		}
	};

	// componentDidMount() {
	// 	this.startTimer();
	// }

	componentDidUpdate(prevProps) {
		if (!prevProps.participant.onHold && this.props.participant.onHold) {
			console.log('hold');
			this.startTimer();
		}
		if (prevProps.participant.onHold && !this.props.participant.onHold) {
			console.log('unhold');
			this.clearTimer();
		}
	}

	render() {
		const { participant } = this.props;
		let { uniqueId } = this.props.participant;
		let statusTemplate = templates.CallParticipantStatusLive;

		// if (!participant.onHold) {
		// 	this.clearTimer();
		// }

		if (participant.onHold) {
			console.log('on hold');
			// this.startTimer();
			statusTemplate = templates.CallParticipantStatusOnHold;
		}
		if (participant.status === 'recently_left') {
			statusTemplate = templates.CallParticipantStatusLeft;
		}
		if (participant.connecting) {
			statusTemplate = templates.CallParticipantStatusConnecting;
		}
		if (this.props.showKickConfirmation) {
			statusTemplate = templates.CallParticipantStatusKickConfirmation;
		}
		return this.props.listMode ? (
			<Status className="ParticipantCanvas-Status">
				{!this.props.participant.onHold ? (
					<Template source={statusTemplate} />
				) : (
					<div style={{ display: 'flex', justifyContent: 'left' }}>
						<Template source={statusTemplate} /> |
						<p>
							<span id={`minutes-${uniqueId}`}> 00</span>:<span id={`seconds-${uniqueId}`}>00</span>
						</p>
					</div>
				)}
			</Status>
		) : (
			<Status className="ParticipantCanvas-Status">
				{!this.props.participant.onHold ? (
					<Template source={statusTemplate} />
				) : (
					<div style={{ display: 'flex', justifyContent: 'center' }}>
						<Template source={statusTemplate} /> |
						<p>
							<span id={`minutes-${uniqueId}`}> 00</span>:<span id={`seconds-${uniqueId}`}>00</span>
						</p>
					</div>
				)}
			</Status>
		);
	}
}
const mapStateToProps = (state, ownProps) => {
	const { participant } = ownProps;
	const componentViewStates = state.flex.view.componentViewStates;
	const customParticipants = componentViewStates.customParticipants || {};
	const participantState = customParticipants[participant.uniqueId];
	return {
		showKickConfirmation: participantState && participantState.showKickConfirmation
	};
};
export default connect(mapStateToProps)(withTheme(ParticipantStatus));
