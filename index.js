import React from 'react';
import PT from 'prop-types';
import RN from 'react-native';

const alphabet = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const characterHeight = 14;
const scrubberWidth = 16;
const tooltipWidth = 50;
const tooltipMargin = 20;

class Scrubber extends React.PureComponent {
	static propTypes = {
		onScrub: PT.func.isRequired
	};

	constructor(props) {
		super(props);
		this.state = {character: ''};
		this.tooltipAnim = new RN.Animated.Value(0);
		this.handleUserScrubbing();
	}

	handleUserScrubbing = () => {
		this.panResponder = RN.PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => true,
			onResponderTerminationRequest: () => false,
			onPanResponderGrant: (e, gs) => this.scrubMove(e, gs, true),
			onPanResponderTerminate: this.scrubStop,
			onPanResponderMove: (e, gs) => this.scrubMove(e, gs, false),
			onPanResponderRelease: this.scrubStop
		});
	};

	scrubStop = () => {
		this.setState({character: ''});
	};

	scrubMove = (e, gestureState, onGrant) => {
		if (!this.alphabetY)) {
			return;
		}

		let locationY;
		if (onGrant) {
			locationY = e.nativeEvent.locationY + gestureState.dy;
		} else {
			// nativeEvent.locationY doesn't work as expected when pan responder moves, so a work
			// around is provided below
			locationY = gestureState.y0 - this.alphabetY + gestureState.dy;
		}
		locationY = Math.max(0, Math.min(this.innerHeight, locationY));

		const scrubIndex = Math.floor(locationY / characterHeight);
		const safeIndex = Math.min(alphabet.length - 1, Math.max(0, scrubIndex));
		const newChar = alphabet[safeIndex];

		if (newChar !== this.state.character) {
			this.onNewCharacter(newChar);
		}

		const tooltipOffset = this.getTooltipOffsetByLocationY(locationY);
		this.tooltipAnim.setValue(tooltipOffset);
	};

	onNewCharacter = char => {
		this.props.onScrub(char);
		if (this.panResponder.getInteractionHandle()) {
			InteractionManager.clearInteractionHandle(this.panResponder.getInteractionHandle());
		}
		this.setState({character: char});
	};

	getTooltipOffsetByLocationY = locationY => {
		const alphabetOffset = (this.outerHeight - this.innerHeight) / 2;
		const activeOffset = alphabetOffset + locationY;
		const negativeTooltipOffset = tooltipWidth + tooltipMargin;
		const resultingOffset = activeOffset - negativeTooltipOffset;

		return resultingOffset;
	};

	render() {
		const tooltipStyle = {transform: [{translateY: this.tooltipAnim}]};

		return (
			<RN.View
				style={styles.container}
				pointerEvents="box-none"
				onLayout={e => (this.outerHeight = e.nativeEvent.layout.height)}
			>
				<RN.View
					style={styles.alphabet}
					{...this.panResponder.panHandlers}
					pointerEvents="box-only"
					onLayout={e => {
						this.innerHeight = e.nativeEvent.layout.height;
						this.alphabetRef.measure((x, y, width, height, pageX, pageY) => {
							this.alphabetY = pageY;
						});
					}}
					ref={c => (this.alphabetRef = c)}
				>
					{alphabet.map(char => (
						<RN.TouchableWithoutFeedback key={char}>
							<RN.View>
								<RN.Text style={styles.character}>{char}</RN.Text>
							</RN.View>
						</RN.TouchableWithoutFeedback>
					))}
				</RN.View>
				{!!this.state.character && (
					<RN.Animated.View style={[styles.tooltip, tooltipStyle]} pointerEvents="none">
						<RN.Text style={styles.tooltipText}>{this.state.character}</RN.Text>
					</RN.Animated.View>
				)}
			</RN.View>
		);
	}
}

export default Scrubber;

const styles = RN.StyleSheet.create({
	container: {
		width: scrubberWidth + tooltipWidth + tooltipMargin,
		alignItems: 'flex-end',
		justifyContent: 'center',
		flex: 1
	},
	alphabet: {
		width: scrubberWidth
	},
	character: {
		backgroundColor: 'transparent',
		color: '#888888',
		fontSize: 11,
		height: characterHeight,
		textAlign: 'center',
		width: scrubberWidth,
		paddingLeft: 2
	},
	tooltip: {
		position: 'absolute',
		backgroundColor: 'white',
		width: tooltipWidth,
		height: tooltipWidth,
		borderRadius: tooltipWidth / 2,
		borderWidth: 1,
		borderColor: '#888888',
		overflow: 'hidden',
		top: 0,
		right: scrubberWidth + tooltipMargin,
		alignItems: 'center',
		justifyContent: 'center'
	},
	tooltipText: {
		color: 'black',
		fontSize: 14
	}
});
