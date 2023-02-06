import React from 'react';
import { connect } from 'react-redux'
import { Route, Switch } from 'react-router';
import SlackActions from '../actions/SlackActions';
import AdvancedSearchWindow from './AdvancedSearchWindow';
import DisplayOption from './DisplayOption';

import './SearchForm.less';

class SearchForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showAdvancedSearchWindow: null,
      showSearchDropdown: false,
    };
  }
  toggleAdvancedSearchWindow() {
    this.setState({
      showAdvancedSearchWindow: !this.state.showAdvancedSearchWindow
    });
  }
  toggleSearchDropdown() {
    this.setState(({showSearchDropdown}) => ({
      showSearchDropdown: !showSearchDropdown,
    }));
  }
  onSearch(e) {
    e.preventDefault();

    this.props.updateSearchWord(this.refs.search.value);
  }
  render() {
    const searchWord = this.props.match ? this.props.match.params.searchWord : '';
    return (
      <div>
        <div className="search-form-wrapper">
          <p className="display-options">
            <DisplayOption option="hideBotMessages">
              Hide bot messages
            </DisplayOption>
            <DisplayOption option="hideThreadOnlyMessages">
              Hide thread-only messages
            </DisplayOption>
          </p>
          <p className="advanced-search-toggler" onClick={this.toggleAdvancedSearchWindow.bind(this)}>advanced search</p>
          <form className="search-form" onSubmit={this.onSearch.bind(this)}>
            <input type="search" ref="search" defaultValue={searchWord} placeholder="Search" />
          </form>
          <span className="search-dropdown-toggler" onClick={this.toggleSearchDropdown.bind(this)}>
            <span className="circle"/>
            <span className="circle"/>
            <span className="circle"/>
          </span>
          <span className="search-dropdown" style={this.state.showSearchDropdown ? {} : {display: 'none'}}>
            <span className="advanced-search-toggler" onClick={this.toggleAdvancedSearchWindow.bind(this)}>
              advanced search
            </span>
            <DisplayOption option="hideBotMessages">
              Hide bot messages
            </DisplayOption>
            <DisplayOption option="hideThreadOnlyMessages">
              Hide thread-only messages
            </DisplayOption>
          </span>
        </div>
        <AdvancedSearchWindow
          toggleAdvancedSearchWindow={this.toggleAdvancedSearchWindow.bind(this)}
          visible={this.state.showAdvancedSearchWindow}
        />
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return {
    updateSearchWord: searchWord => {
      dispatch(SlackActions.updateSearchWord(searchWord));
    }
  };
};
const ConnectedSearchForm = connect(null, mapDispatchToProps)(SearchForm);

const SearchFormWithRouteParam = () => (
  <Switch>
    <Route path="/search/:searchWord" component={ConnectedSearchForm} />
    <Route path="/" component={ConnectedSearchForm} />
  </Switch>
);

export default SearchFormWithRouteParam;
