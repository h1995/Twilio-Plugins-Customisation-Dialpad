import React from 'react';
import Autosuggest from 'react-autosuggest';
import './FavouriteNumbers.css'

const options = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

var suggestions = []

const url = process.env.REACT_APP_FAVOURITE_CONACT_BASE_URL;
// const url = "https://lava-shark-2065.twil.io/assets/opal-foreign-contacts.json";
fetch(url, options).then(async (resp) => {
  suggestions = await resp.json();
  }).catch((err)=>{
  console.log(err);
});

function escapeRegexCharacters(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSuggestions(value) {
  const escapedValue = escapeRegexCharacters(value.trim());
  const regex = new RegExp( escapedValue, 'i');

  return suggestions.filter(suggestion => regex.test(suggestion.contactNo) || regex.test(suggestion.contactName));
}

function getSuggestionNumber(suggestion) {
  return suggestion.contactNo;
}

function renderSuggestion(suggestion) {
  return (
    <span>{suggestion.contactName} </span>
  );
}

class FavouriteNumbers extends React.Component {

  constructor() {
    super();

    this.state = {
      contactnameValue: '',
      contactnameSuggestions: [],
      contactnumberValue: '',
      contactnumberSuggestions: []
    };    
  }

  onNicknameChange = (event, { newValue }) => {
    this.setState({
      contactnameValue: newValue
    },
    function() {
        //  console.log("contactnameValue -- "+this.state.contactnameValue)
          return this.props.handleNumberClick(this.state.contactnameValue);
    });
  };
  
  onContactnameSuggestionsFetchRequested = ({ value }) => {
    this.setState({
      contactnameSuggestions: getSuggestions(value)
    });
  };

  onContactnameSuggestionsClearRequested = () => {
    this.setState({
      contactnameSuggestions: []
    });
  };

  onContactnameSuggestionSelected = (event, { suggestion }) => {
    this.setState({
      contactnumberValue: suggestion.contactNo
    });
  };

  render() {
    const { 
      contactnameValue, 
      contactnameSuggestions
    } = this.state;
    const contactnameInputProps = {
      placeholder: "Type Name or Number",
      value: contactnameValue,
      onChange: this.onNicknameChange
    };

    return (
      <div className="">
        <Autosuggest 
          suggestions={contactnameSuggestions}
          onSuggestionsFetchRequested={this.onContactnameSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onContactnameSuggestionsClearRequested}
          onSuggestionSelected={this.onContactnameSuggestionSelected}
          getSuggestionValue={getSuggestionNumber}
          renderSuggestion={renderSuggestion}
          inputProps={contactnameInputProps}
        />
      </div>
    );
  }
}

export default FavouriteNumbers;
	