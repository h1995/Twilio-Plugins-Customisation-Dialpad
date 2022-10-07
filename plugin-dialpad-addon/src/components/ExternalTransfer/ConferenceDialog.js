import * as React from 'react';
import { connect } from 'react-redux';
import { Actions, withTheme, Manager, withTaskContext } from '@twilio/flex-ui';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import ConferenceService from '../../helpers/ConferenceService';
import FavouriteNumbers from './FavouriteNumbers';
import { Tooltip } from '@material-ui/core';

class ConferenceDialog extends React.Component {
  state = {
    conferenceTo: '',
    favouriteNumbers: []
  };

  componentDidMount() {
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const url = process.env.REACT_APP_FAVOURITE_CONACT_BASE_URL;
    // const url = "https://lava-shark-2065.twil.io/assets/opal-foreign-contacts.json"
    fetch(url, options).then(async (resp) => {
      const data = await resp.json();
      this.setState({ favouriteNumbers: data });
    }).catch((err)=>{
      console.log(err);
    });
  }

  handleClose = () => {
    this.closeDialog();
  }

  closeDialog = () => {
    Actions.invokeAction('SetComponentState', {
      name: 'ConferenceDialog',
      state: { isOpen: false }
    });
  }

  handleKeyPress = e => {
    const key = e.key;

    if (key === 'Enter') {
      this.addConferenceParticipant();
      this.closeDialog();
    }
  }

  handleChange = (e) => {
    const value = e.target.value;
    const newFavouriteNumbers = this.state.favouriteNumbers.map((ele) => ({
      ...ele,
      isSelected: e.target.value === ele.contactNo
    }));
    this.setState({ conferenceTo: value, favouriteNumbers: newFavouriteNumbers });
  };

  handleDialButton = () => {
    this.addConferenceParticipant();
    this.closeDialog();
  }

  addConferenceParticipant = async () => {
    const to = this.state.conferenceTo;

    const { task } = this.props;
    const conference = task && (task.conference || {});
    const { conferenceSid } = conference;

    const mainConferenceSid = task.attributes.conference ? 
      task.attributes.conference.sid : conferenceSid;

    let from;
    if (this.props.phoneNumber) {
      from = this.props.phoneNumber
    } else {
      from = Manager.getInstance().serviceConfiguration.outbound_call_flows.default.caller_id;
    }

    // Adding entered number to the conference
    console.log(`Adding ${to} to conference`);
    let participantCallSid;
    try {

      participantCallSid = await ConferenceService.addParticipant(mainConferenceSid, from, to);
      ConferenceService.addConnectingParticipant(mainConferenceSid, participantCallSid, 'unknown');

    } catch (error) {
      console.error('Error adding conference participant:', error);
    }
    this.setState({ conferenceTo: '' });
  }

  handleNumberClick = (number) => {
    const newFavouriteNumbers = this.state.favouriteNumbers.map((ele) => ({
      ...ele,
      isSelected: number === ele.contactNo
    }));
    this.setState({ conferenceTo: number, favouriteNumbers: newFavouriteNumbers });
    console.log("conferenceTo -- "+this.state.conferenceTo)
  };

  render() {
    return (
      <Dialog
        open={this.props.isOpen || false}
        onClose={this.handleClose}
      >
        <DialogContent style={{overflowY:'unset',height:'250px'}}>
          <DialogContentText>
            {Manager.getInstance().strings.DIALPADExternalTransferPhoneNumberPopupHeader}
          </DialogContentText>
          
            <FavouriteNumbers numberList={this.state.favouriteNumbers} handleNumberClick={this.handleNumberClick} />
          
          
        </DialogContent>
        <DialogActions>
          
          <Button
            onClick={this.handleDialButton}
            color="primary"
          >
            {Manager.getInstance().strings.DIALPADExternalTransferPhoneNumberPopupDial}
          </Button>
          <Button
            onClick={this.closeDialog}
            color="secondary"
          >
            {Manager.getInstance().strings.DIALPADExternalTransferPhoneNumberPopupCancel}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

const mapStateToProps = state => {
  const componentViewStates = state.flex.view.componentViewStates;
  const conferenceDialogState = componentViewStates && componentViewStates.ConferenceDialog;
  const isOpen = conferenceDialogState && conferenceDialogState.isOpen;
  return {
    isOpen,
    phoneNumber: state.flex.worker.attributes.phone
  };
};

export default connect(mapStateToProps)(withTheme(withTaskContext(ConferenceDialog)));
