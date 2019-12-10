import React from 'react';
import {
  FlatList,
  Image,
  Linking,
  Picker,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import withUnstated from '@airship/with-unstated';
import GlobalDataContainer from '../containers/GlobalDataContainer';
import { Ionicons } from '@expo/vector-icons';
import FadeIn from 'react-native-fade-in-image';
import { ScrollView, RectButton } from 'react-native-gesture-handler';

import NavigationOptions from '../config/NavigationOptions';
import { NavigationActions } from 'react-navigation';

import { BoldText, MediumText, RegularText } from '../components/StyledText';
import LoadingPlaceholder from '../components/LoadingPlaceholder';

import { Colors, FontSizes, Layout } from '../constants';
import Constants from 'expo-constants';

import { find, propEq } from 'ramda';
import { Palette, Skin } from '../config/Settings';
import i18n from "../../i18n";


class PlayerRow extends React.Component {
  render() {
    const { item: player } = this.props;

    let thumbnail = Skin.Roster_DefaultThumbnail;
    if (player.defaultThumbnail)
      thumbnail = {uri: player.defaultThumbnail};
    if (player.thumbnail)
      thumbnail = {uri: player.thumbnail};

    let twitterDisplay;
    if (player.twitter) {
      twitterDisplay = <TouchableOpacity
          style={{justifyContent: 'flex-start', alignContent: 'center'}}
          key={player.twitter}
          onPress={() => {
            //WebBrowser.openBrowserAsync('http://twitter.com/' + player.twitter);
            Linking.openURL('https://twitter.com/intent/tweet?text=@' + player.twitter + '+');
          }}
        >
          <Ionicons
            name={'logo-twitter'}
            size={30}
            style={{
              color: Palette.Sky,
              marginTop: 3,
              marginBottom: 3,
              marginLeft: 10,
              marginRight: 10,
              backgroundColor: 'transparent'
            }}
          />
        </TouchableOpacity>    
    }
    return (
      <View style={styles.row}>
        <RectButton
          onPress={this._handlePress}
          activeOpacity={0.05}
          style={{ flex: 1 }}
        >
          <View style={{flexDirection: i18n.getFlexDirection()}}>
            <View style={styles.rowAvatarContainer}>
              <FadeIn>
                <Image
                  source={thumbnail}
                  style={{ width: 50, height: 50, borderRadius: 25 }}
                />
              </FadeIn>
            </View>
            <View style={styles.rowData}>
              <View
                style={{ width: 25, alignItems: 'flex-end', paddingRight: 5 }}
              >
                <BoldText>{player.squadNumber}</BoldText>
              </View>
              <View style={{ flexDirection: 'column' }}>
                <MediumText style={{ textAlign: i18n.getRTLTextAlign(), writingDirection: i18n.getWritingDirection() }}>{player.name}</MediumText>
                <RegularText style={{ textAlign: i18n.getRTLTextAlign(), writingDirection: i18n.getWritingDirection() }}>{i18n.t('positions.' + player.position)}</RegularText>
                <RegularText style={{ textAlign: i18n.getRTLTextAlign(), writingDirection: i18n.getWritingDirection() }}>{player.flag}</RegularText>
              </View>
            </View>
          </View>
        </RectButton>
        {twitterDisplay}
      </View>
    );
  }

  _handlePress = () => {
    this.props.onPress(this.props.item);
  };
}

class Roster extends React.Component {
  static navigationOptions = {
    headerTitle: i18n.t('screens.roster.title'),
    ...NavigationOptions
  };
  
  state = {
    rosterTitle: i18n.t('screens.roster.title'),
    rosters: [],
    currentRosterID: null
  }

  componentDidMount() {
    this.setData();
  }

  componentDidUpdate(prevProps) {
    if (
      !prevProps.globalData.state.players &&
      this.props.globalData.state.players ||
      !prevProps.globalData.state.rosters &&
      this.props.globalData.state.rosters
    ) {
      this.setData();
    }
  }

  setData = () => {
    let rosters = this.props.globalData.state.rosters;
    if (rosters.length > 0) {
      var currentRosterId = rosters[0]._id;
      //search for a default property. if present, override that to the current id.
      for(let i = 0; i < rosters.length; i++) {
        if(rosters[i].default) {
          currentRosterId = rosters[i]._id;
        }
      }
      this.setState({ rosters, currentRosterID: currentRosterId });
    } else {
      this.setState({ rosters, currentRosterID: null });
    }
  }

  render() {
    let listDisplay = null;
    let header = null;

    if (this.state.rosters.length > 0)
    {
      let pickerItems = [];
      this.state.rosters.forEach(element => {
        pickerItems.push(<Picker.Item label={element.rosterTitle} value={element._id} key={element._id} />);
      });
      header = 
        <Picker
          mode='dropdown'
          enabled={pickerItems.length > 1}
          selectedValue={this.state.currentRosterID}
          onValueChange={(itemValue) => this.setState({currentRosterID: itemValue})}
        >
          {pickerItems}
        </Picker>
  
      let currentRoster = this.state.rosters.find(element => element._id == this.state.currentRosterID);
      let playerData = currentRoster.players;
      // inherit defaults from Roster document and pass to Player
      playerData.forEach(element => {
        if (currentRoster.hasOwnProperty('defaultThumbnail'))
          element.defaultThumbnail = currentRoster.defaultThumbnail;
        if (currentRoster.hasOwnProperty('defaultImage'))
          element.defaultImage = currentRoster.defaultImage;
      });
  
      listDisplay = 
        <FlatList
          renderScrollComponent={props => <ScrollView {...props} />}
          data={playerData}
          renderItem={this._renderItem}
          keyExtractor={(item, index) => index.toString()}
        />
    }
    else
    {
      header = 
        <Picker>
          <Picker.Item label={i18n.t('screens.roster.nosquadsfound')} />
        </Picker>
      listDisplay = <View style={{flex: 1}}/>
    }
    

    return (
      <LoadingPlaceholder>
        <View style={styles.container}>
          {header}
          {listDisplay}
          <RectButton
            enabled={this.state.rosters.length > 0}
            style={styles.twitterListButtonStyle}
            onPress={this._handlePressTwitterListButton}
            underlayColor="#fff"
          >
            <Ionicons
              name="md-list"
              size={23}
              style={{
                color: '#fff',
                marginTop: 3,
                marginBottom: 3,
                marginLeft: 5,
                marginRight: 5,
                backgroundColor: 'transparent'
              }}
            />
            <RegularText style={styles.twitterListButtonText}>
              {i18n.t('screens.roster.twitterlist')}
            </RegularText>
          </RectButton>
        </View>
      </LoadingPlaceholder>
    );
  }

  _renderSectionHeader = ({ section }) => {
    return (
      <View style={styles.sectionHeader}>
        <RegularText>{section.rosterTitle}</RegularText>
      </View>
    );
  };

  _renderItem = ({ item }) => {
    return <PlayerRow item={item} onPress={this._handlePressRow} />;
  };

  _handlePressRow = player => {
    this.props.navigation.navigate('Player', { player });
  };

  _handlePressTwitterListButton = () => {
    let roster = this.state.rosters.find(element => element._id == this.state.currentRosterID)
    this.props.navigation.navigate('TwitterList', {roster});
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: 100 + '%'
  },
  row: {
    flex: 1,
    paddingTop: 10,
    padding: 10,
    backgroundColor: Palette.White,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: i18n.getFlexDirection()
  },
  rowAvatarContainer: {
    paddingVertical: 5,
    paddingHorizontal: 5
  },
  rowData: {
    flex: 1,
    flexDirection: i18n.getFlexDirection()
  },
  sectionHeader: {
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 5,
    backgroundColor: '#eee',
    borderWidth: 1,
    borderColor: '#eee'
  },
  twitterListButtonStyle: {
    backgroundColor: Skin.Songbook_ToCButtonBackground,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 0,
    width: 100 + '%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexDirection: i18n.getFlexDirection()
  },
  twitterListButtonText: {
    fontSize: FontSizes.normalButton,
    color: '#fff',
    textAlign: 'center'
  }
});

export default withUnstated(Roster, { globalData: GlobalDataContainer });