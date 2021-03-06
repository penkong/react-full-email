import React, { Component } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import { connect } from 'react-redux';

import * as actions from '../actions';

import Header from './Header';
import Landing from './Landing';
import Dashboard from './Dashboard';
import SurveyNew from './surveys/SurveyNew';
import Fix from './Fix';

//whole app use styles obj in top 

const styles = {
  main: 'w-100 bg-near-white vh-100 aspect-ratio--4x3'
};
class App extends Component {
  componentDidMount() {
    this.props.fetchUser();
    this.forceUpdate();
  }
  
  render() {
    return (
      <div className={styles.main} style={{fontFamily: "Roboto"}} >
        <BrowserRouter>
          <div>
            <Header/>
            <Route path="/" exact component={Landing}/>
            <Route path="/surveys" exact component={Dashboard}/>
            <Route path="/surveys/new" exact component={SurveyNew}/>
            <Route path="/ambulance" exact component={Fix}/>
          </div>
        </BrowserRouter>
      </div>
    );
  }
}

export default connect(null, actions)(App);