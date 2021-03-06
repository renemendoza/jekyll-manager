import React, { PropTypes, Component } from 'react';
import { findDOMNode } from 'react-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { browserHistory, withRouter } from 'react-router';
import _ from 'underscore';
import { HotKeys } from 'react-hotkeys';
import DocumentTitle from 'react-document-title';

import Collapsible from '../../components/Collapsible';
import Button from '../../components/Button';
import Splitter from '../../components/Splitter';
import Errors from '../../components/Errors';
import Breadcrumbs from '../../components/Breadcrumbs';
import InputPath from '../../components/form/InputPath';
import InputTitle from '../../components/form/InputTitle';
import MarkdownEditor from '../../components/MarkdownEditor';
import Metadata from '../MetaFields';
import { fetchPage, deletePage, putPage } from '../../actions/pages';
import { updateTitle, updateBody, updatePath } from '../../actions/metadata';
import { clearErrors } from '../../actions/utils';
import { preventDefault, generateTitle } from '../../utils/helpers';
import { getLeaveMessage, getDeleteMessage } from '../../constants/lang';
import { ADMIN_PREFIX } from '../../constants';

export class PageEdit extends Component {

  constructor(props) {
    super(props);

    this.routerWillLeave = this.routerWillLeave.bind(this);
    this.handleClickSave = this.handleClickSave.bind(this);

    this.state = { panelHeight: 0 };
  }

  componentDidMount() {
    const { fetchPage, params, router, route } = this.props;
    const [directory, ...rest] = params.splat;
    const filename = rest.join('.');
    fetchPage(directory, filename);

    router.setRouteLeaveHook(route, this.routerWillLeave);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.updated !== nextProps.updated) {
      const new_path = nextProps.page.path;
      const path = this.props.page.path;
      // redirect if the path is changed
      if (new_path != path) {
        browserHistory.push(`${ADMIN_PREFIX}/pages/${new_path}`);
      }
    }

    if (this.props.new_field_count !== nextProps.new_field_count) {
      const panelHeight = findDOMNode(this.refs.frontmatter).clientHeight;
      this.setState({ panelHeight: panelHeight + 60 }); // extra height for various types of metafield field
    }
  }

  componentWillUnmount() {
    const { clearErrors, errors} = this.props;
    // clear errors if any
    if (errors.length) {
      clearErrors();
    }
  }

  routerWillLeave(nextLocation) {
    if (this.props.fieldChanged) {
      return getLeaveMessage();
    }
  }

  handleClickSave(e) {
    const { putPage, fieldChanged, params } = this.props;

    // Prevent the default event from bubbling
    preventDefault(e);

    if (fieldChanged) {
      const [directory, ...rest] = params.splat;
      const filename = rest.join('.');
      putPage('edit', directory, filename);
    }
  }

  handleClickDelete(name) {
    const { deletePage, params } = this.props;
    const confirm = window.confirm(getDeleteMessage(name));
    if (confirm) {
      const [directory, ...rest] = params.splat;
      const filename = rest.join('.');
      deletePage(directory, filename);
      browserHistory.push(`${ADMIN_PREFIX}/pages/${directory || ''}`);
    }
  }

  render() {
    const { isFetching, page, errors, updateTitle, updateBody, updatePath,
      updated, fieldChanged, params, config } = this.props;

    if (isFetching) {
      return null;
    }

    if (_.isEmpty(page)) {
      return <h1>{`Could not find the page.`}</h1>;
    }

    const keyboardHandlers = {
      'save': this.handleClickSave,
    };

    const { name, path, raw_content, http_url, front_matter } = page;
    const [directory, ...rest] = params.splat;

    const layout = front_matter.layout || '';
    const title = front_matter.title || '';

    const inputPath = <InputPath onChange={updatePath} type="pages" path={path} />;
    const metafields = (
      <Metadata ref="frontmatter" fields={{ layout, title, raw_content, path: path, ...front_matter }} />
    );

    return (
      <DocumentTitle title={generateTitle(name, directory, 'Pages')}>
        <HotKeys handlers={keyboardHandlers} className="single">

          {errors.length > 0 && <Errors errors={errors} />}

          <div className="content-header">
            <Breadcrumbs splat={path} type="pages" />
          </div>

          <div className="content-wrapper">
            <div className="content-body">
              <InputTitle onChange={updateTitle} title={title} ref="title" />

              <Collapsible
                label="Edit Filename or Path"
                panel={inputPath} />

              <Collapsible
                label="Edit Front Matter"
                overflow={true}
                height={this.state.panelHeight}
                panel={metafields} />

              <Splitter />

              <MarkdownEditor
                onChange={updateBody}
                onSave={this.handleClickSave}
                placeholder="Body"
                initialValue={raw_content}
                ref="editor" />
              <Splitter />
            </div>

            <div className="content-side">
              <Button
                onClick={this.handleClickSave}
                type="save"
                active={fieldChanged}
                triggered={updated}
                icon="save"
                block />
              <Button
                to={http_url}
                type="view"
                icon="eye"
                active={true}
                block />
              <Splitter />
              <Button
                onClick={() => this.handleClickDelete(name)}
                type="delete"
                active={true}
                icon="trash"
                block />
            </div>
          </div>
        </HotKeys>
      </DocumentTitle>
    );
  }
}

PageEdit.propTypes = {
  page: PropTypes.object.isRequired,
  fetchPage: PropTypes.func.isRequired,
  deletePage: PropTypes.func.isRequired,
  putPage: PropTypes.func.isRequired,
  updateTitle: PropTypes.func.isRequired,
  updateBody: PropTypes.func.isRequired,
  updatePath: PropTypes.func.isRequired,
  clearErrors: PropTypes.func.isRequired,
  isFetching: PropTypes.bool.isRequired,
  errors: PropTypes.array.isRequired,
  fieldChanged: PropTypes.bool.isRequired,
  updated: PropTypes.bool.isRequired,
  params: PropTypes.object.isRequired,
  router: PropTypes.object.isRequired,
  route: PropTypes.object.isRequired,
  config: PropTypes.object.isRequired,
  new_field_count: PropTypes.number
};

const mapStateToProps = (state) => ({
  page: state.pages.page,
  isFetching: state.pages.isFetching,
  fieldChanged: state.metadata.fieldChanged,
  updated: state.pages.updated,
  errors: state.utils.errors,
  config: state.config.config,
  new_field_count: state.metadata.new_field_count
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchPage,
  deletePage,
  putPage,
  updateTitle,
  updateBody,
  updatePath,
  clearErrors
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PageEdit));
